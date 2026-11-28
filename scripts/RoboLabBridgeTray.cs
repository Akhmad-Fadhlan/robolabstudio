using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
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
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.0.0")]

namespace RoboLabBridge
{
    public class BridgeDashboardForm : Form
    {
        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        private readonly TrayApp _controller;
        private readonly Rectangle _headerRect = new Rectangle(0, 0, 500, 92);
        private readonly Rectangle _topCloseRect = new Rectangle(456, 16, 28, 28);
        private readonly Rectangle _statusCardRect = new Rectangle(24, 108, 452, 74);
        private readonly Rectangle _infoGrid1Rect = new Rectangle(24, 194, 220, 62);
        private readonly Rectangle _infoGrid2Rect = new Rectangle(256, 194, 220, 62);
        private readonly Rectangle _btnRestartRect = new Rectangle(24, 274, 142, 42);
        private readonly Rectangle _btnFolderRect = new Rectangle(178, 274, 144, 42);
        private readonly Rectangle _btnHideRect = new Rectangle(334, 274, 142, 42);

        private int _hoverBtn = 0; // 1=topClose, 2=restart, 3=folder, 4=hide

        public BridgeDashboardForm(TrayApp controller, Icon appIcon)
        {
            _controller = controller;
            this.Text = "RoboLab Studio — Compiler Bridge Control Center";
            this.Size = new Size(500, 340);
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(9, 13, 24);
            this.ForeColor = Color.White;
            this.DoubleBuffered = true;
            this.Icon = appIcon;

            this.MouseDown += (s, e) =>
            {
                if (e.Button == MouseButtons.Left && _headerRect.Contains(e.Location) && !_topCloseRect.Contains(e.Location))
                {
                    ReleaseCapture();
                    SendMessage(this.Handle, 0xA1, 0x2, 0);
                }
            };

            this.MouseMove += (s, e) =>
            {
                int nextHover = 0;
                if (_topCloseRect.Contains(e.Location)) nextHover = 1;
                else if (_btnRestartRect.Contains(e.Location)) nextHover = 2;
                else if (_btnFolderRect.Contains(e.Location)) nextHover = 3;
                else if (_btnHideRect.Contains(e.Location)) nextHover = 4;

                if (nextHover != _hoverBtn)
                {
                    _hoverBtn = nextHover;
                    this.Cursor = nextHover != 0 ? Cursors.Hand : Cursors.Default;
                    this.Invalidate();
                }
            };

            this.MouseLeave += (s, e) =>
            {
                _hoverBtn = 0;
                this.Cursor = Cursors.Default;
                this.Invalidate();
            };

            this.MouseClick += (s, e) =>
            {
                if (e.Button != MouseButtons.Left) return;
                if (_topCloseRect.Contains(e.Location) || _btnHideRect.Contains(e.Location))
                {
                    this.Hide();
                }
                else if (_btnRestartRect.Contains(e.Location))
                {
                    _controller.RestartBridge();
                    this.Invalidate();
                }
                else if (_btnFolderRect.Contains(e.Location))
                {
                    _controller.OpenInstallFolder();
                }
            };
        }

        private static GraphicsPath CreateRoundPath(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int d = radius * 2;
            path.AddArc(rect.X, rect.Y, d, d, 180, 90);
            path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
            path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
            path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

            using (LinearGradientBrush headerBg = new LinearGradientBrush(_headerRect, Color.FromArgb(16, 26, 48), Color.FromArgb(9, 13, 24), 90f))
            {
                g.FillRectangle(headerBg, _headerRect);
            }
            using (LinearGradientBrush topBar = new LinearGradientBrush(new Rectangle(0, 0, this.Width, 4), Color.FromArgb(16, 185, 129), Color.FromArgb(56, 189, 248), 0f))
            {
                g.FillRectangle(topBar, 0, 0, this.Width, 4);
            }

            // Emblem
            Rectangle logoRect = new Rectangle(24, 20, 48, 48);
            using (GraphicsPath lp = CreateRoundPath(logoRect, 12))
            using (LinearGradientBrush lb = new LinearGradientBrush(logoRect, Color.FromArgb(16, 185, 129), Color.FromArgb(14, 165, 233), 135f))
            {
                g.FillPath(lb, lp);
            }
            using (Pen rp = new Pen(Color.White, 2f))
            using (SolidBrush wb = new SolidBrush(Color.White))
            {
                g.DrawRectangle(rp, 37, 36, 22, 16);
                g.DrawLine(rp, 48, 29, 48, 36);
                g.FillEllipse(wb, 42, 41, 3, 3);
                g.FillEllipse(wb, 51, 41, 3, 3);
            }

            using (Font tagFont = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (Font titleFont = new Font("Segoe UI", 13.5f, FontStyle.Bold))
            using (Font subFont = new Font("Segoe UI", 8.5f))
            using (SolidBrush emBrush = new SolidBrush(Color.FromArgb(52, 211, 153)))
            using (SolidBrush wBrush = new SolidBrush(Color.White))
            using (SolidBrush mBrush = new SolidBrush(Color.FromArgb(148, 163, 184)))
            {
                g.DrawString("ROBOLAB STUDIO • SYSTEM TRAY DAEMON", tagFont, emBrush, 84, 19);
                g.DrawString("Compiler Bridge Control Center", titleFont, wBrush, 82, 33);
                g.DrawString("Service kompilasi lokal C++ Arduino & ESP32/ESP8266", subFont, mBrush, 84, 58);
            }

            // Close button
            using (GraphicsPath cp = CreateRoundPath(_topCloseRect, 8))
            using (SolidBrush cb = new SolidBrush(_hoverBtn == 1 ? Color.FromArgb(239, 68, 68) : Color.FromArgb(22, 32, 54)))
            {
                g.FillPath(cb, cp);
                using (Font xf = new Font("Segoe UI", 9f, FontStyle.Bold))
                using (SolidBrush xb = new SolidBrush(Color.White))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString("✕", xf, xb, _topCloseRect, sf);
                }
            }

            // Status Card
            bool online = _controller.IsBridgeOnline;
            using (GraphicsPath sp = CreateRoundPath(_statusCardRect, 12))
            using (SolidBrush sb = new SolidBrush(online ? Color.FromArgb(13, 31, 38) : Color.FromArgb(36, 24, 24)))
            using (Pen sPen = new Pen(online ? Color.FromArgb(16, 185, 129) : Color.FromArgb(245, 158, 11), 1.2f))
            {
                g.FillPath(sb, sp);
                g.DrawPath(sPen, sp);
            }

            using (SolidBrush dotBrush = new SolidBrush(online ? Color.FromArgb(16, 185, 129) : Color.FromArgb(245, 158, 11)))
            {
                g.FillEllipse(dotBrush, 42, 136, 14, 14);
            }

            using (Font stTitle = new Font("Segoe UI", 10.5f, FontStyle.Bold))
            using (Font stSub = new Font("Segoe UI", 8.5f))
            using (SolidBrush wb = new SolidBrush(Color.White))
            using (SolidBrush subB = new SolidBrush(Color.FromArgb(186, 230, 253)))
            {
                g.DrawString(online ? "Bridge Aktif & Siap Kompilasi (Port 3001)" : _controller.StatusMessage, stTitle, wb, 68, 124);
                g.DrawString("Endpoint: http://127.0.0.1:3001/api/health • Auto-Reconnect Aktif", stSub, subB, 68, 147);
            }

            // Info Grid Cards
            DrawInfoCard(g, _infoGrid1Rect, "TARGET MIKROKONTROLER", "Uno • Nano • Mega • ESP32 • ESP8266");
            DrawInfoCard(g, _infoGrid2Rect, "MODE KOMUNIKASI", "WebSerial & Native USB Upload");

            // Action Buttons
            DrawButton(g, _btnRestartRect, "↻ Restart Bridge", _hoverBtn == 2, true);
            DrawButton(g, _btnFolderRect, "📂 Folder Instalasi", _hoverBtn == 3, false);
            DrawButton(g, _btnHideRect, "Sembunyikan", _hoverBtn == 4, false);

            using (Pen outerPen = new Pen(Color.FromArgb(38, 56, 92), 1.5f))
            {
                g.DrawRectangle(outerPen, 0, 0, this.Width - 1, this.Height - 1);
            }
        }

        private void DrawInfoCard(Graphics g, Rectangle rect, string label, string val)
        {
            using (GraphicsPath p = CreateRoundPath(rect, 10))
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(14, 21, 38)))
            using (Pen border = new Pen(Color.FromArgb(30, 44, 72), 1f))
            {
                g.FillPath(bg, p);
                g.DrawPath(border, p);
            }
            using (Font lf = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (Font vf = new Font("Segoe UI", 9f, FontStyle.Bold))
            using (SolidBrush lb = new SolidBrush(Color.FromArgb(56, 189, 248)))
            using (SolidBrush vb = new SolidBrush(Color.FromArgb(226, 232, 240)))
            {
                g.DrawString(label, lf, lb, rect.X + 14, rect.Y + 12);
                g.DrawString(val, vf, vb, rect.X + 14, rect.Y + 31);
            }
        }

        private void DrawButton(Graphics g, Rectangle rect, string text, bool hovered, bool primary)
        {
            using (GraphicsPath p = CreateRoundPath(rect, 10))
            {
                if (primary)
                {
                    using (LinearGradientBrush bb = new LinearGradientBrush(
                        rect,
                        hovered ? Color.FromArgb(20, 200, 140) : Color.FromArgb(16, 185, 129),
                        hovered ? Color.FromArgb(14, 165, 233) : Color.FromArgb(8, 145, 178),
                        0f))
                    {
                        g.FillPath(bb, p);
                    }
                }
                else
                {
                    using (SolidBrush bb = new SolidBrush(hovered ? Color.FromArgb(34, 48, 78) : Color.FromArgb(20, 30, 52)))
                    using (Pen bp = new Pen(Color.FromArgb(45, 62, 95), 1f))
                    {
                        g.FillPath(bb, p);
                        g.DrawPath(bp, p);
                    }
                }

                using (Font bf = new Font("Segoe UI", 9f, FontStyle.Bold))
                using (SolidBrush tb = new SolidBrush(Color.White))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString(text, bf, tb, rect, sf);
                }
            }
        }
    }

    public class TrayApp : ApplicationContext
    {
        private NotifyIcon _trayIcon;
        private Process _nodeProcess;
        private ToolStripMenuItem _statusItem;
        private BridgeDashboardForm _dashboardForm;
        private Icon _appIcon;
        private string _appDir;
        private bool _isExiting = false;

        public bool IsBridgeOnline { get; private set; }
        public string StatusMessage { get; private set; }

        public TrayApp()
        {
            _appDir = AppDomain.CurrentDomain.BaseDirectory;
            _appIcon = CreateRobotIcon();
            StatusMessage = "Status: Starting (Port 3001)...";

            _statusItem = new ToolStripMenuItem(StatusMessage);
            _statusItem.Enabled = false;

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.BackColor = Color.FromArgb(15, 23, 42);
            menu.ForeColor = Color.FromArgb(241, 245, 249);
            menu.Items.Add(new ToolStripMenuItem("RoboLab Studio Compiler Bridge") { Enabled = false, Font = new Font(SystemFonts.MenuFont, FontStyle.Bold) });
            menu.Items.Add(_statusItem);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Buka Control Center Bridge", null, OnShowDashboard);
            menu.Items.Add("Cek Endpoint Browser (127.0.0.1:3001)", null, OnOpenStatus);
            menu.Items.Add("Restart Compiler Bridge", null, OnRestart);
            menu.Items.Add("Buka Folder Instalasi", null, OnOpenFolder);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Keluar (Stop Bridge)", null, OnExit);

            _trayIcon = new NotifyIcon()
            {
                Icon = _appIcon,
                ContextMenuStrip = menu,
                Text = "RoboLab Compiler Bridge (Port 3001)",
                Visible = true
            };

            _trayIcon.DoubleClick += OnShowDashboard;

            StartCompilerServer();

            _trayIcon.ShowBalloonTip(
                3000,
                "RoboLab Compiler Bridge Aktif",
                "Server kompilasi lokal berjalan di background pada Port 3001. Klik ganda ikon untuk membuka Control Center.",
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
                    g.SmoothingMode = SmoothingMode.AntiAlias;
                    g.Clear(Color.Transparent);
                    using (LinearGradientBrush bg = new LinearGradientBrush(new Rectangle(2, 2, 28, 28), Color.FromArgb(16, 185, 129), Color.FromArgb(14, 165, 233), 45f))
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

        private void UpdateState(bool online, string msg)
        {
            IsBridgeOnline = online;
            StatusMessage = msg;
            if (_statusItem != null) _statusItem.Text = msg;
            if (_dashboardForm != null && !_dashboardForm.IsDisposed && _dashboardForm.Visible)
            {
                try { _dashboardForm.Invalidate(); } catch { }
            }
        }

        private void StartCompilerServer()
        {
            StopCompilerServer();

            if (IsLocalBridgeAlreadyHealthy())
            {
                UpdateState(true, "Status: Online (Port 3001 Ready)");
                return;
            }

            string bundledNode = Path.Combine(_appDir, "node", "node.exe");
            string nodeExe = File.Exists(bundledNode) ? bundledNode : "node";
            string scriptPath = Path.Combine(_appDir, "compile-server.cjs");

            if (!File.Exists(scriptPath))
            {
                UpdateState(false, "Status: Error (compile-server.cjs tidak ditemukan)");
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
                            UpdateState(true, "Status: Online (Port 3001 Ready)");
                            return;
                        }
                        UpdateState(false, "Status: Stopped (Restarting...)");
                        Thread.Sleep(2000);
                        if (!_isExiting) StartCompilerServer();
                    }
                };
                _nodeProcess.Start();
                UpdateState(true, "Status: Online (Port 3001)");
            }
            catch (Exception ex)
            {
                UpdateState(false, "Status: Gagal (" + ex.Message + ")");
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

        public void RestartBridge()
        {
            StartCompilerServer();
        }

        public void OpenInstallFolder()
        {
            try { Process.Start("explorer.exe", _appDir); } catch { }
        }

        private void OnShowDashboard(object sender, EventArgs e)
        {
            if (_dashboardForm == null || _dashboardForm.IsDisposed)
            {
                _dashboardForm = new BridgeDashboardForm(this, _appIcon);
            }
            _dashboardForm.Show();
            _dashboardForm.BringToFront();
            _dashboardForm.Activate();
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
            OpenInstallFolder();
        }

        private void OnExit(object sender, EventArgs e)
        {
            _isExiting = true;
            if (_dashboardForm != null && !_dashboardForm.IsDisposed)
            {
                try { _dashboardForm.Close(); } catch { }
            }
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
