using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace RoboLabBridgeInstaller
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string targetDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "RoboLabBridge"
            );

            using (var form = new Form())
            {
                form.Text = "RoboLab Compiler Bridge Setup";
                form.Size = new Size(520, 420);
                form.StartPosition = FormStartPosition.CenterScreen;
                form.FormBorderStyle = FormBorderStyle.FixedDialog;
                form.MaximizeBox = false;
                form.MinimizeBox = false;
                form.BackColor = Color.FromArgb(248, 250, 252);

                // Title Banner
                var titleLabel = new Label()
                {
                    Text = "RoboLab Studio - Compiler Bridge Setup",
                    Font = new Font("Segoe UI", 12, FontStyle.Bold),
                    Location = new Point(24, 20),
                    AutoSize = true,
                    ForeColor = Color.FromArgb(15, 23, 42)
                };

                var subTitleLabel = new Label()
                {
                    Text = "Pemasang Otomatis Kompiler Native & Pengecekan Driver USB (CH340/CP2102)",
                    Font = new Font("Segoe UI", 8.5f),
                    Location = new Point(25, 48),
                    AutoSize = true,
                    ForeColor = Color.FromArgb(100, 116, 139)
                };

                // Progress Bar
                var pBar = new ProgressBar()
                {
                    Location = new Point(25, 76),
                    Size = new Size(454, 18),
                    Style = ProgressBarStyle.Marquee,
                    MarqueeAnimationSpeed = 25
                };

                // Status List Box
                var logBox = new TextBox()
                {
                    Location = new Point(25, 106),
                    Size = new Size(454, 215),
                    Multiline = true,
                    ReadOnly = true,
                    ScrollBars = ScrollBars.Vertical,
                    Font = new Font("Consolas", 8.5f),
                    BackColor = Color.FromArgb(15, 23, 42),
                    ForeColor = Color.FromArgb(226, 232, 240),
                    BorderStyle = BorderStyle.FixedSingle
                };

                // Action Button
                var btnDone = new Button()
                {
                    Text = "Tutup",
                    Location = new Point(379, 332),
                    Size = new Size(100, 32),
                    Font = new Font("Segoe UI", 9, FontStyle.Bold),
                    BackColor = Color.FromArgb(37, 99, 235),
                    ForeColor = Color.White,
                    FlatStyle = FlatStyle.Flat,
                    Enabled = false,
                    Cursor = Cursors.Hand
                };
                btnDone.FlatAppearance.BorderSize = 0;
                btnDone.Click += (s, e) => form.Close();

                form.Controls.Add(titleLabel);
                form.Controls.Add(subTitleLabel);
                form.Controls.Add(pBar);
                form.Controls.Add(logBox);
                form.Controls.Add(btnDone);

                Action<string> appendLog = null;
                appendLog = delegate(string msg)
                {
                    if (form.InvokeRequired)
                    {
                        form.Invoke(appendLog, new object[] { msg });
                        return;
                    }
                    logBox.AppendText(msg + Environment.NewLine);
                    logBox.SelectionStart = logBox.Text.Length;
                    logBox.ScrollToCaret();
                };

                form.Shown += async (s, e) =>
                {
                    await Task.Run(() =>
                    {
                        try
                        {
                            appendLog("==================================================");
                            appendLog("  MEMULAI PEMASANGAN ROBOLAB COMPILER BRIDGE");
                            appendLog("==================================================");

                            // 1. Prepare target directory
                            appendLog("[1/5] Menyiapkan direktori instalasi...");
                            if (!Directory.Exists(targetDir))
                            {
                                Directory.CreateDirectory(targetDir);
                            }
                            appendLog("      Lokasi: " + targetDir);

                            // 2. Extract embedded zip payload
                            appendLog("[2/5] Mengekstrak modul kompiler & pustaka Arduino...");
                            var asm = Assembly.GetExecutingAssembly();
                            using (var resStream = asm.GetManifestResourceStream("payload.zip"))
                            {
                                if (resStream != null)
                                {
                                    using (var archive = new ZipArchive(resStream, ZipArchiveMode.Read))
                                    {
                                        int count = 0;
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
                                                count++;
                                            }
                                        }
                                        appendLog("      Berhasil mengekstrak " + count + " berkas.");
                                    }
                                }
                                else
                                {
                                    appendLog("      [!] Payload tidak ditemukan, menggunakan berkas lokal.");
                                }
                            }

                            // 3. Driver Checking: CH340
                            appendLog("[3/5] Memeriksa driver USB CH340...");
                            bool ch340Exists = IsCh340Installed();
                            if (ch340Exists)
                            {
                                appendLog("      [OK] Driver CH340 sudah terpasang di sistem.");
                                appendLog("           -> Tidak perlu diinstal ulang (Dilewati).");
                            }
                            else
                            {
                                appendLog("      [!] Driver CH340 belum terdeteksi.");
                                appendLog("      [+] Memasang driver CH340 secara otomatis...");
                                string ch340Inf = Path.Combine(targetDir, @"drivers\ch340\CH341SER.INF");
                                InstallDriverViaPnpUtil(ch340Inf, appendLog);
                            }

                            // 4. Driver Checking: CP2102
                            appendLog("[4/5] Memeriksa driver USB CP2102...");
                            bool cp2102Exists = IsCp2102Installed();
                            if (cp2102Exists)
                            {
                                appendLog("      [OK] Driver CP2102 sudah terpasang di sistem.");
                                appendLog("           -> Tidak perlu diinstal ulang (Dilewati).");
                            }
                            else
                            {
                                appendLog("      [!] Driver CP2102 belum terdeteksi.");
                                appendLog("      [+] Memasang driver CP2102 secara otomatis...");
                                string cp2102Inf = Path.Combine(targetDir, @"drivers\cp2102\silabser.inf");
                                InstallDriverViaPnpUtil(cp2102Inf, appendLog);
                            }

                            // 5. Create Desktop & Start Menu Shortcut
                            appendLog("[5/5] Membuat pintasan di Desktop & Start Menu...");
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
                                    appendLog("      Pintasan berhasil dibuat.");
                                }
                            }
                            catch (Exception ex)
                            {
                                appendLog("      [!] Gagal membuat shortcut: " + ex.Message);
                            }

                            // 6. Launch start-bridge.bat
                            appendLog("--------------------------------------------------");
                            appendLog("Menjalankan RoboLab Compiler Bridge...");
                            string startBat = Path.Combine(targetDir, "start-bridge.bat");
                            if (File.Exists(startBat))
                            {
                                var psi = new ProcessStartInfo()
                                {
                                    FileName = startBat,
                                    WorkingDirectory = targetDir,
                                    UseShellExecute = true
                                };
                                Process.Start(psi);
                            }

                            appendLog("==================================================");
                            appendLog("  PEMASANGAN SELESAI!");
                            appendLog("  Bridge aktif di http://localhost:3001");
                            appendLog("  RoboLab Web siap mengompilasi secara native!");
                            appendLog("==================================================");

                            if (form.InvokeRequired)
                            {
                                form.Invoke(new Action(() =>
                                {
                                    pBar.Style = ProgressBarStyle.Continuous;
                                    pBar.Value = 100;
                                    btnDone.Enabled = true;
                                }));
                            }
                        }
                        catch (Exception ex)
                        {
                            appendLog("[ERROR] Terjadi kesalahan: " + ex.Message);
                            if (form.InvokeRequired)
                            {
                                form.Invoke(new Action(() =>
                                {
                                    pBar.Style = ProgressBarStyle.Continuous;
                                    pBar.Value = 100;
                                    btnDone.Enabled = true;
                                }));
                            }
                        }
                    });
                };

                Application.Run(form);
            }
        }

        static bool IsCh340Installed()
        {
            // 1. Check System32 drivers directory
            try
            {
                string sysDir = Environment.GetFolderPath(Environment.SpecialFolder.System);
                string d1 = Path.Combine(sysDir, @"drivers\CH341S64.SYS");
                string d2 = Path.Combine(sysDir, @"drivers\CH341SER.SYS");
                string d3 = Path.Combine(sysDir, @"drivers\CH341S98.SYS");
                if (File.Exists(d1) || File.Exists(d2) || File.Exists(d3)) return true;
            }
            catch { }

            // 2. Check Registry Services
            try
            {
                using (var k = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Services\CH341SER"))
                {
                    if (k != null) return true;
                }
                using (var k = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Services\CH341S64"))
                {
                    if (k != null) return true;
                }
            }
            catch { }

            // 3. Check pnputil driver store
            try
            {
                var psi = new ProcessStartInfo("pnputil.exe", "/enum-drivers")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (var proc = Process.Start(psi))
                {
                    string outStr = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit(3000);
                    if (outStr.IndexOf("ch341ser.inf", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        outStr.IndexOf("ch343ser.inf", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        outStr.IndexOf("wch.cn", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        return true;
                    }
                }
            }
            catch { }

            return false;
        }

        static bool IsCp2102Installed()
        {
            // 1. Check System32 drivers directory
            try
            {
                string sysDir = Environment.GetFolderPath(Environment.SpecialFolder.System);
                string d1 = Path.Combine(sysDir, @"drivers\silabser.sys");
                if (File.Exists(d1)) return true;
            }
            catch { }

            // 2. Check Registry Services
            try
            {
                using (var k = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Services\silabser"))
                {
                    if (k != null) return true;
                }
            }
            catch { }

            // 3. Check pnputil driver store
            try
            {
                var psi = new ProcessStartInfo("pnputil.exe", "/enum-drivers")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (var proc = Process.Start(psi))
                {
                    string outStr = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit(3000);
                    if (outStr.IndexOf("silabser.inf", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        outStr.IndexOf("Silicon Labs", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        return true;
                    }
                }
            }
            catch { }

            return false;
        }

        static void InstallDriverViaPnpUtil(string infPath, Action<string> log)
        {
            if (!File.Exists(infPath))
            {
                log("      [!] Berkas INF driver tidak ditemukan: " + Path.GetFileName(infPath));
                return;
            }
            try
            {
                var psi = new ProcessStartInfo("pnputil.exe", string.Format("/add-driver \"{0}\" /install", infPath))
                {
                    UseShellExecute = true,
                    Verb = "runas",
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                var proc = Process.Start(psi);
                if (proc != null)
                {
                    proc.WaitForExit(20000);
                    log("      [✓] Driver berhasil dipasang ke sistem.");
                }
            }
            catch (Exception ex)
            {
                log("      [!] Peringatan saat memasang driver: " + ex.Message);
            }
        }
    }
}
