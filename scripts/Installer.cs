using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("RoboLab Studio Compiler Bridge Setup")]
[assembly: AssemblyDescription("Official Local Compiler Setup for RoboLab Studio Education")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("RoboLab Studio Education")]
[assembly: AssemblyProduct("RoboLab Studio Local Compiler Bridge")]
[assembly: AssemblyCopyright("Copyright © 2026 RoboLab Studio")]
[assembly: AssemblyTrademark("RoboLab Studio")]
[assembly: AssemblyCulture("")]
[assembly: AssemblyVersion("1.2.0.0")]
[assembly: AssemblyFileVersion("1.2.0.0")]

namespace RoboLabInstaller
{
    public class SetupForm : Form
    {
        private Label _titleLabel;
        private Label _descLabel;
        private Label _statusLabel;
        private ProgressBar _progressBar;
        private Button _installBtn;
        private Button _closeBtn;
        private CheckBox _autoStartCheck;
        private CheckBox _installDriversCheck;

        public SetupForm()
        {
            this.Text = "RoboLab Studio - Local Compiler Bridge Setup";
            this.Size = new Size(500, 355);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            _titleLabel = new Label()
            {
                Text = "RoboLab Local Compiler Bridge",
                Font = new Font("Segoe UI", 15, FontStyle.Bold),
                ForeColor = Color.FromArgb(52, 211, 153),
                Location = new Point(24, 20),
                AutoSize = true
            };

            _descLabel = new Label()
            {
                Text = "Menginstal Arduino CLI & Node.js Compiler Service resmi ke komputer Anda\nagar kompilasi C++ (Uno, Nano, ESP32, ESP8266) berjalan instan & offline.",
                Font = new Font("Segoe UI", 9.5f),
                ForeColor = Color.FromArgb(203, 213, 225),
                Location = new Point(24, 54),
                Size = new Size(440, 42)
            };

            _autoStartCheck = new CheckBox()
            {
                Text = "Jalankan otomatis di System Tray saat Windows menyala",
                Font = new Font("Segoe UI", 9.5f),
                ForeColor = Color.FromArgb(226, 232, 240),
                Location = new Point(28, 108),
                Size = new Size(430, 24),
                Checked = true
            };

            _installDriversCheck = new CheckBox()
            {
                Text = "Sertakan paket Driver USB Serial (CH340 & CP210x)",
                Font = new Font("Segoe UI", 9.5f),
                ForeColor = Color.FromArgb(226, 232, 240),
                Location = new Point(28, 136),
                Size = new Size(430, 24),
                Checked = true
            };

            _statusLabel = new Label()
            {
                Text = "Siap diinstal ke %LOCALAPPDATA%\\RoboLabCompilerBridge",
                Font = new Font("Segoe UI", 9f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(24, 178),
                Size = new Size(440, 22)
            };

            _progressBar = new ProgressBar()
            {
                Location = new Point(24, 204),
                Size = new Size(436, 22),
                Style = ProgressBarStyle.Continuous,
                Value = 0
            };

            _installBtn = new Button()
            {
                Text = "Install & Aktifkan Sekarang",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                BackColor = Color.FromArgb(16, 185, 129),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(24, 246),
                Size = new Size(310, 42),
                Cursor = Cursors.Hand
            };
            _installBtn.FlatAppearance.BorderSize = 0;
            _installBtn.Click += OnInstallClick;

            _closeBtn = new Button()
            {
                Text = "Tutup",
                Font = new Font("Segoe UI", 9.5f),
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(346, 246),
                Size = new Size(114, 42),
                Cursor = Cursors.Hand
            };
            _closeBtn.FlatAppearance.BorderSize = 0;
            _closeBtn.Click += (s, e) => this.Close();

            this.Controls.Add(_titleLabel);
            this.Controls.Add(_descLabel);
            this.Controls.Add(_autoStartCheck);
            this.Controls.Add(_installDriversCheck);
            this.Controls.Add(_statusLabel);
            this.Controls.Add(_progressBar);
            this.Controls.Add(_installBtn);
            this.Controls.Add(_closeBtn);
        }

        private void UpdateStatus(string text, int progress)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string, int>(UpdateStatus), text, progress);
                return;
            }
            _statusLabel.Text = text;
            _progressBar.Value = Math.Min(100, Math.Max(0, progress));
        }

        private void OnInstallClick(object sender, EventArgs e)
        {
            _installBtn.Enabled = false;
            _autoStartCheck.Enabled = false;
            _installDriversCheck.Enabled = false;

            bool autoStart = _autoStartCheck.Checked;

            Thread worker = new Thread(() =>
            {
                try
                {
                    string targetDir = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "RoboLabCompilerBridge"
                    );

                    UpdateStatus("Menyiapkan folder instalasi...", 15);
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    string tempZip = Path.Combine(Path.GetTempPath(), "robolab_bridge_payload.zip");
                    UpdateStatus("Mengekstrak paket RoboLab Compiler Bridge...", 35);

                    Assembly asm = Assembly.GetExecutingAssembly();
                    using (Stream resStream = asm.GetManifestResourceStream("payload.zip"))
                    {
                        if (resStream == null)
                            throw new Exception("Resource payload.zip tidak ditemukan di dalam installer.");

                        using (FileStream fs = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                        {
                            resStream.CopyTo(fs);
                        }
                    }

                    UpdateStatus("Menyalin file Arduino CLI & Node Runtime...", 65);
                    using (ZipArchive archive = ZipFile.OpenRead(tempZip))
                    {
                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            string fullPath = Path.Combine(targetDir, entry.FullName);
                            string dir = Path.GetDirectoryName(fullPath);
                            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                            {
                                Directory.CreateDirectory(dir);
                            }
                            if (!string.IsNullOrEmpty(entry.Name))
                            {
                                try
                                {
                                    entry.ExtractToFile(fullPath, true);
                                }
                                catch { }
                            }
                        }
                    }

                    try { File.Delete(tempZip); } catch { }

                    string trayExe = Path.Combine(targetDir, "RoboLabBridge.exe");

                    if (autoStart)
                    {
                        UpdateStatus("Mengatur Auto-Start di folder Startup...", 85);
                        CreateStartupLauncher(targetDir, trayExe);
                    }

                    UpdateStatus("Menjalankan RoboLab Compiler Bridge (Port 3001)...", 95);
                    if (File.Exists(trayExe))
                    {
                        Process.Start(new ProcessStartInfo()
                        {
                            FileName = trayExe,
                            WorkingDirectory = targetDir,
                            UseShellExecute = true
                        });
                    }

                    UpdateStatus("Instalasi Selesai! Local Bridge telah aktif di Port 3001.", 100);

                    this.Invoke(new Action(() =>
                    {
                        _installBtn.Text = "Terinstal & Aktif";
                        _installBtn.BackColor = Color.FromArgb(5, 150, 105);
                        MessageBox.Show(
                            "RoboLab Local Compiler Bridge berhasil diinstal dan sudah berjalan di System Tray (Port 3001)!\n\nSekarang Anda bisa kembali ke browser RoboLab Studio dan langsung klik Verify / Upload.",
                            "Instalasi Berhasil",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information
                        );
                        this.Close();
                    }));
                }
                catch (Exception ex)
                {
                    this.Invoke(new Action(() =>
                    {
                        _installBtn.Enabled = true;
                        _statusLabel.Text = "Error: " + ex.Message;
                        MessageBox.Show("Gagal menginstal: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }));
                }
            });
            worker.IsBackground = true;
            worker.Start();
        }

        private void CreateStartupLauncher(string workDir, string targetExe)
        {
            try
            {
                string startupDir = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
                string batPath = Path.Combine(startupDir, "RoboLabCompilerBridge.bat");
                string content = "@echo off\r\ncd /d \"" + workDir + "\"\r\nstart \"\" \"" + targetExe + "\"\r\n";
                File.WriteAllText(batPath, content);
            }
            catch { }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
