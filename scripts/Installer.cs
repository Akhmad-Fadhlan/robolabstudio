using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;

namespace RoboLabBridgeInstaller
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RoboLabBridge");

            using (var form = new Form())
            {
                form.Text = "RoboLab Compiler Bridge Installer";
                form.Size = new Size(460, 220);
                form.StartPosition = FormStartPosition.CenterScreen;
                form.FormBorderStyle = FormBorderStyle.FixedDialog;
                form.MaximizeBox = false;
                form.MinimizeBox = false;
                form.BackColor = Color.FromArgb(245, 247, 250);

                var titleLabel = new Label()
                {
                    Text = "Pemasangan RoboLab Compiler Bridge",
                    Font = new Font("Segoe UI", 12, FontStyle.Bold),
                    Location = new Point(20, 20),
                    AutoSize = true,
                    ForeColor = Color.FromArgb(30, 41, 59)
                };

                var statusLabel = new Label()
                {
                    Text = "Mengekstrak modul compiler dan pustaka Arduino...",
                    Font = new Font("Segoe UI", 9),
                    Location = new Point(22, 58),
                    AutoSize = true,
                    ForeColor = Color.FromArgb(71, 85, 105)
                };

                var pBar = new ProgressBar()
                {
                    Location = new Point(22, 85),
                    Size = new Size(400, 24),
                    Style = ProgressBarStyle.Marquee,
                    MarqueeAnimationSpeed = 30
                };

                form.Controls.Add(titleLabel);
                form.Controls.Add(statusLabel);
                form.Controls.Add(pBar);

                form.Shown += async (s, e) =>
                {
                    try
                    {
                        await System.Threading.Tasks.Task.Run(() =>
                        {
                            // 1. Prepare target directory
                            if (!Directory.Exists(targetDir))
                            {
                                Directory.CreateDirectory(targetDir);
                            }

                            // 2. Extract embedded zip payload
                            var asm = Assembly.GetExecutingAssembly();
                            using (var resStream = asm.GetManifestResourceStream("payload.zip"))
                            {
                                if (resStream != null)
                                {
                                    using (var archive = new ZipArchive(resStream, ZipArchiveMode.Read))
                                    {
                                        foreach (var entry in archive.Entries)
                                        {
                                            string fullPath = Path.Combine(targetDir, entry.FullName);
                                            if (string.IsNullOrEmpty(entry.Name))
                                            {
                                                Directory.CreateDirectory(fullPath);
                                            }
                                            else
                                            {
                                                string dir = Path.GetDirectoryName(fullPath);
                                                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                                                entry.ExtractToFile(fullPath, true);
                                            }
                                        }
                                    }
                                }
                            }

                            // 3. Create Desktop & Start Menu Shortcut via WScript.Shell
                            try
                            {
                                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                                if (shellType != null)
                                {
                                    dynamic shell = Activator.CreateInstance(shellType);
                                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                                    string linkPath = Path.Combine(desktop, "RoboLab Compiler Bridge.lnk");
                                    dynamic shortcut = shell.CreateShortcut(linkPath);
                                    shortcut.TargetPath = Path.Combine(targetDir, "start-bridge.bat");
                                    shortcut.WorkingDirectory = targetDir;
                                    shortcut.Description = "RoboLab Studio - Local Compiler Bridge";
                                    shortcut.Save();

                                    string programs = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                                    string progLink = Path.Combine(programs, "RoboLab Compiler Bridge.lnk");
                                    dynamic shortcut2 = shell.CreateShortcut(progLink);
                                    shortcut2.TargetPath = Path.Combine(targetDir, "start-bridge.bat");
                                    shortcut2.WorkingDirectory = targetDir;
                                    shortcut2.Description = "RoboLab Studio - Local Compiler Bridge";
                                    shortcut2.Save();
                                }
                            }
                            catch { }

                            // 4. Start the bridge
                            string startBat = Path.Combine(targetDir, "start-bridge.bat");
                            if (File.Exists(startBat))
                            {
                                ProcessStartInfo psi = new ProcessStartInfo()
                                {
                                    FileName = startBat,
                                    WorkingDirectory = targetDir,
                                    UseShellExecute = true
                                };
                                Process.Start(psi);
                            }
                        });

                        form.Close();
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Gagal memasang RoboLab Compiler Bridge: " + ex.Message, "Kesalahan Pemasangan", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        form.Close();
                    }
                };

                Application.Run(form);
            }
        }
    }
}
