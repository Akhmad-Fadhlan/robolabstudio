using System;
using System.IO;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;

namespace RoboLabBridgeTray
{
    static class Program
    {
        private static NotifyIcon trayIcon;
        private static ContextMenuStrip trayMenu;
        private static Process serverProcess;
        private static string appDir;
        private static Mutex singleInstanceMutex;

        [STAThread]
        static void Main()
        {
            // Ensure only one instance of the tray app runs
            bool createdNew;
            singleInstanceMutex = new Mutex(true, "RoboLabBridgeTray_SingleInstance_Mutex", out createdNew);
            if (!createdNew)
            {
                // Already running
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            appDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RoboLabBridge");
            if (!Directory.Exists(appDir))
            {
                appDir = AppDomain.CurrentDomain.BaseDirectory;
            }

            // Start server in background
            StartServer();

            // Create Tray Context Menu
            trayMenu = new ContextMenuStrip();
            
            var headerItem = new ToolStripMenuItem("⚡ RoboLab Compiler Bridge") { Enabled = false, Font = new Font("Segoe UI", 9, FontStyle.Bold) };
            var statusItem = new ToolStripMenuItem("🟢 Status: Aktif (Port 3001)") { Enabled = false };
            var sep1 = new ToolStripSeparator();

            var openWebItem = new ToolStripMenuItem("🌐 Buka RoboLab Web");
            openWebItem.Click += (s, e) =>
            {
                try { Process.Start("https://robolabstudio.vercel.app"); }
                catch { Process.Start("http://localhost:3001"); }
            };

            var restartItem = new ToolStripMenuItem("🔄 Restart Server");
            restartItem.Click += (s, e) =>
            {
                StartServer();
                trayIcon.ShowBalloonTip(2000, "RoboLab Compiler Bridge", "Server lokal berhasil direstart di http://localhost:3001", ToolTipIcon.Info);
            };

            var sep2 = new ToolStripSeparator();

            var exitItem = new ToolStripMenuItem("❌ Tutup Server & Keluar");
            exitItem.Click += (s, e) =>
            {
                StopServer();
                trayIcon.Visible = false;
                Application.Exit();
            };

            trayMenu.Items.Add(headerItem);
            trayMenu.Items.Add(statusItem);
            trayMenu.Items.Add(sep1);
            trayMenu.Items.Add(openWebItem);
            trayMenu.Items.Add(restartItem);
            trayMenu.Items.Add(sep2);
            trayMenu.Items.Add(exitItem);

            // Create Icon (Draw a custom crisp ⚡ icon if no .ico file)
            Icon icon = CreateDefaultIcon();

            trayIcon = new NotifyIcon()
            {
                Text = "RoboLab Compiler Bridge (Port 3001 - AKTIF)",
                Icon = icon,
                ContextMenuStrip = trayMenu,
                Visible = true
            };

            trayIcon.DoubleClick += (s, e) =>
            {
                trayIcon.ShowBalloonTip(3000, "RoboLab Compiler Bridge", "Server lokal aktif di http://localhost:3001.\nRoboLab Web terhubung secara otomatis.", ToolTipIcon.Info);
            };

            trayIcon.ShowBalloonTip(3000, "RoboLab Compiler Bridge", "Server compiler lokal aktif di latar belakang (Port 3001)!", ToolTipIcon.Info);

            Application.ApplicationExit += (s, e) => StopServer();

            Application.Run();
        }

        static void StartServer()
        {
            StopServer();

            string scriptPath = Path.Combine(appDir, "compile-server.cjs");
            if (!File.Exists(scriptPath))
            {
                scriptPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compile-server.cjs");
            }

            // Find node executable
            string nodePath = "node";
            string[] nodeCandidates = new string[]
            {
                @"C:\nvm4w\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\nodejs\node.exe"),
                @"C:\Program Files\nodejs\node.exe",
                Path.Combine(appDir, "node.exe")
            };
            foreach (var cand in nodeCandidates)
            {
                if (File.Exists(cand))
                {
                    nodePath = cand;
                    break;
                }
            }

            try
            {
                var psi = new ProcessStartInfo(nodePath, string.Format("\"{0}\"", scriptPath))
                {
                    WorkingDirectory = appDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                serverProcess = Process.Start(psi);
            }
            catch { }
        }

        static void StopServer()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch { }

            try
            {
                var psi = new ProcessStartInfo("cmd.exe", "/c \"for /f \\\"tokens=5\\\" %a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %a\"")
                {
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                var p = Process.Start(psi);
                if (p != null) p.WaitForExit(1500);
            }
            catch { }
        }

        static Icon CreateDefaultIcon()
        {
            try
            {
                using (var bmp = new Bitmap(32, 32))
                {
                    using (var g = Graphics.FromImage(bmp))
                    {
                        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                        // Blue circular badge
                        using (var brush = new SolidBrush(Color.FromArgb(37, 99, 235)))
                        {
                            g.FillEllipse(brush, 1, 1, 30, 30);
                        }
                        // Emerald outline
                        using (var pen = new Pen(Color.FromArgb(16, 185, 129), 2f))
                        {
                            g.DrawEllipse(pen, 1, 1, 30, 30);
                        }
                        // Yellow lightning bolt
                        using (var boltBrush = new SolidBrush(Color.FromArgb(254, 240, 138)))
                        {
                            Point[] bolt = new Point[]
                            {
                                new Point(17, 4),
                                new Point(9, 17),
                                new Point(15, 17),
                                new Point(13, 28),
                                new Point(23, 13),
                                new Point(17, 13)
                            };
                            g.FillPolygon(boltBrush, bolt);
                        }
                    }
                    return Icon.FromHandle(bmp.GetHicon());
                }
            }
            catch
            {
                return SystemIcons.Application;
            }
        }
    }
}
