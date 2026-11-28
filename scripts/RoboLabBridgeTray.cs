using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("RoboLab Local Compiler Bridge")]
[assembly: AssemblyDescription("Official Local Arduino & ESP32/ESP8266 Compiler Service for RoboLab Studio")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("RoboLab Studio Education")]
[assembly: AssemblyProduct("RoboLab Studio Local Compiler Bridge")]
[assembly: AssemblyCopyright("Copyright © 2026 RoboLab Studio")]
[assembly: AssemblyTrademark("RoboLab Studio")]
[assembly: AssemblyCulture("")]
[assembly: AssemblyVersion("1.2.0.0")]
[assembly: AssemblyFileVersion("1.2.0.0")]

namespace RoboLabBridge
{
    public class TrayApp : ApplicationContext
    {
        private NotifyIcon _trayIcon;
        private Process _nodeProcess;
        private ToolStripMenuItem _statusItem;
        private string _appDir;
        private bool _isExiting = false;

        public TrayApp()
        {
            _appDir = AppDomain.CurrentDomain.BaseDirectory;

            _statusItem = new ToolStripMenuItem("Status: Starting (Port 3001)...");
            _statusItem.Enabled = false;

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add(new ToolStripMenuItem("RoboLab Studio Compiler Bridge") { Enabled = false, Font = new Font(SystemFonts.MenuFont, FontStyle.Bold) });
            menu.Items.Add(_statusItem);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Buka Status di Browser (127.0.0.1:3001)", null, OnOpenStatus);
            menu.Items.Add("Restart Compiler Bridge", null, OnRestart);
            menu.Items.Add("Buka Folder Instalasi", null, OnOpenFolder);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Keluar (Stop Bridge)", null, OnExit);

            _trayIcon = new NotifyIcon()
            {
                Icon = CreateRobotIcon(),
                ContextMenuStrip = menu,
                Text = "RoboLab Compiler Bridge (Port 3001)",
                Visible = true
            };

            _trayIcon.DoubleClick += OnOpenStatus;

            StartCompilerServer();

            _trayIcon.ShowBalloonTip(
                3000,
                "RoboLab Compiler Bridge Aktif",
                "Server kompilasi lokal berjalan di background pada Port 3001.",
                ToolTipIcon.Info
            );
        }

        private Icon CreateRobotIcon()
        {
            try
            {
                using (Bitmap bmp = new Bitmap(32, 32))
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    g.Clear(Color.Transparent);
                    using (SolidBrush bg = new SolidBrush(Color.FromArgb(16, 185, 129)))
                    {
                        g.FillEllipse(bg, 2, 2, 28, 28);
                    }
                    using (Pen pen = new Pen(Color.White, 2.5f))
                    {
                        g.DrawRectangle(pen, 8, 10, 16, 13);
                        g.DrawLine(pen, 16, 5, 16, 10);
                    }
                    using (SolidBrush eye = new SolidBrush(Color.White))
                    {
                        g.FillEllipse(eye, 11, 14, 3, 3);
                        g.FillEllipse(eye, 18, 14, 3, 3);
                    }
                    return Icon.FromHandle(bmp.GetHicon());
                }
            }
            catch
            {
                return SystemIcons.Application;
            }
        }

        private bool IsLocalBridgeAlreadyHealthy()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:3001/api/health");
                req.Method = "GET";
                req.Timeout = 1200;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return res.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private void StartCompilerServer()
        {
            StopCompilerServer();

            // Check if another instance of the compiler server is already healthy on port 3001
            if (IsLocalBridgeAlreadyHealthy())
            {
                _statusItem.Text = "Status: Online (Port 3001 Ready)";
                return;
            }

            string bundledNode = Path.Combine(_appDir, "node", "node.exe");
            string nodeExe = File.Exists(bundledNode) ? bundledNode : "node";
            string scriptPath = Path.Combine(_appDir, "compile-server.cjs");

            if (!File.Exists(scriptPath))
            {
                _statusItem.Text = "Status: Error (compile-server.cjs tidak ditemukan)";
                return;
            }

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo()
                {
                    FileName = nodeExe,
                    Arguments = "\"" + scriptPath + "\"",
                    WorkingDirectory = _appDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                psi.EnvironmentVariables["ROBOLAB_COMPILE_PORT"] = "3001";

                _nodeProcess = new Process();
                _nodeProcess.StartInfo = psi;
                _nodeProcess.EnableRaisingEvents = true;
                _nodeProcess.Exited += (s, e) =>
                {
                    if (!_isExiting)
                    {
                        if (IsLocalBridgeAlreadyHealthy())
                        {
                            _statusItem.Text = "Status: Online (Port 3001 Ready)";
                            return;
                        }
                        _statusItem.Text = "Status: Stopped (Restarting...)";
                        Thread.Sleep(2000);
                        if (!_isExiting) StartCompilerServer();
                    }
                };
                _nodeProcess.Start();
                _statusItem.Text = "Status: Online (Port 3001)";
            }
            catch (Exception ex)
            {
                _statusItem.Text = "Status: Gagal (" + ex.Message + ")";
            }
        }

        private void StopCompilerServer()
        {
            try
            {
                if (_nodeProcess != null && !_nodeProcess.HasExited)
                {
                    _nodeProcess.Kill();
                    _nodeProcess.WaitForExit(1500);
                }
            }
            catch { }
            _nodeProcess = null;
        }

        private void OnOpenStatus(object sender, EventArgs e)
        {
            try { Process.Start("http://127.0.0.1:3001/api/health"); } catch { }
        }

        private void OnRestart(object sender, EventArgs e)
        {
            StartCompilerServer();
        }

        private void OnOpenFolder(object sender, EventArgs e)
        {
            try { Process.Start("explorer.exe", _appDir); } catch { }
        }

        private void OnExit(object sender, EventArgs e)
        {
            _isExiting = true;
            _trayIcon.Visible = false;
            StopCompilerServer();
            Application.Exit();
        }
    }

    static class Program
    {
        private static Mutex _mutex;

        [STAThread]
        static void Main()
        {
            bool createdNew;
            _mutex = new Mutex(true, "RoboLabCompilerBridgeTrayMutex", out createdNew);
            if (!createdNew)
            {
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new TrayApp());
        }
    }
}
