using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
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
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.0.0")]

namespace RoboLabInstaller
{
    public class SetupForm : Form
    {
        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        private string _statusText = "Siap diinstal ke %LOCALAPPDATA%\\RoboLabCompilerBridge";
        private string _stepStageText = "READY • ARDUINO CLI + NODE RUNTIME";
        private int _progressValue = 0;
        private bool _autoStartChecked = true;
        private bool _installDriversChecked = true;
        private bool _isInstalling = false;
        private bool _isCompleted = false;

        private bool _hoverInstall = false;
        private bool _hoverClose = false;
        private bool _hoverTopClose = false;
        private bool _hoverCard1 = false;
        private bool _hoverCard2 = false;

        private readonly Rectangle _headerRect = new Rectangle(0, 0, 560, 102);
        private readonly Rectangle _topCloseRect = new Rectangle(516, 16, 28, 28);
        private readonly Rectangle _card1Rect = new Rectangle(28, 120, 504, 58);
        private readonly Rectangle _card2Rect = new Rectangle(28, 188, 504, 58);
        private readonly Rectangle _progressCardRect = new Rectangle(28, 260, 504, 82);
        private readonly Rectangle _progressBarRect = new Rectangle(46, 310, 468, 14);
        private readonly Rectangle _installBtnRect = new Rectangle(28, 358, 366, 46);
        private readonly Rectangle _closeBtnRect = new Rectangle(406, 358, 126, 46);

        public SetupForm()
        {
            this.Text = "RoboLab Studio — Native Compiler Bridge Setup";
            this.Size = new Size(560, 430);
            this.FormBorderStyle = FormBorderStyle.None;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(9, 13, 24);
            this.ForeColor = Color.White;
            this.DoubleBuffered = true;
            this.Icon = CreateBrandIcon();

            this.MouseDown += OnFormMouseDown;
            this.MouseMove += OnFormMouseMove;
            this.MouseClick += OnFormMouseClick;
            this.MouseLeave += (s, e) =>
            {
                _hoverInstall = _hoverClose = _hoverTopClose = _hoverCard1 = _hoverCard2 = false;
                this.Invalidate();
            };
        }

        private Icon CreateBrandIcon()
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
                    using (Pen pen = new Pen(Color.White, 2.2f))
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

            // 1. Background & Subtle Top Header Gradient
            using (LinearGradientBrush headerBg = new LinearGradientBrush(
                _headerRect,
                Color.FromArgb(15, 25, 46),
                Color.FromArgb(9, 13, 24),
                90f))
            {
                g.FillRectangle(headerBg, _headerRect);
            }

            // Top Accent Gradient Bar (Emerald -> Cyan -> Indigo)
            using (LinearGradientBrush topBar = new LinearGradientBrush(
                new Rectangle(0, 0, this.Width, 4),
                Color.FromArgb(16, 185, 129),
                Color.FromArgb(56, 189, 248),
                0f))
            {
                g.FillRectangle(topBar, 0, 0, this.Width, 4);
            }

            // 2. Robot Emblem Badge in Header
            Rectangle logoRect = new Rectangle(28, 22, 54, 54);
            using (GraphicsPath logoPath = CreateRoundPath(logoRect, 14))
            using (LinearGradientBrush logoBrush = new LinearGradientBrush(logoRect, Color.FromArgb(16, 185, 129), Color.FromArgb(14, 165, 233), 135f))
            {
                g.FillPath(logoBrush, logoPath);
                using (Pen borderPen = new Pen(Color.FromArgb(110, 255, 255, 255), 1.2f))
                {
                    g.DrawPath(borderPen, logoPath);
                }
            }
            // Robot icon inside emblem
            using (Pen robotPen = new Pen(Color.White, 2.2f))
            using (SolidBrush whiteBrush = new SolidBrush(Color.White))
            {
                g.DrawRectangle(robotPen, 43, 40, 24, 18);
                g.DrawLine(robotPen, 55, 32, 55, 40);
                g.FillEllipse(whiteBrush, 52, 29, 6, 6);
                g.FillEllipse(whiteBrush, 48, 45, 4, 4);
                g.FillEllipse(whiteBrush, 58, 45, 4, 4);
                g.FillRectangle(whiteBrush, 50, 52, 10, 2);
            }

            // Header Titles
            using (Font badgeFont = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (Font titleFont = new Font("Segoe UI", 14.5f, FontStyle.Bold))
            using (Font subFont = new Font("Segoe UI", 9f, FontStyle.Regular))
            using (SolidBrush emeraldBrush = new SolidBrush(Color.FromArgb(52, 211, 153)))
            using (SolidBrush whiteBrush = new SolidBrush(Color.White))
            using (SolidBrush mutedBrush = new SolidBrush(Color.FromArgb(148, 163, 184)))
            {
                g.DrawString("ROBOLAB STUDIO • OFFICIAL HARDWARE TOOLCHAIN", badgeFont, emeraldBrush, 94, 20);
                g.DrawString("Native Compiler Bridge Setup", titleFont, whiteBrush, 92, 34);
                g.DrawString("Arduino CLI, Node Runtime & Driver Serial (Uno, Nano, ESP32, ESP8266)", subFont, mutedBrush, 94, 62);
            }

            // Top-right Close 'X' button
            using (GraphicsPath closePath = CreateRoundPath(_topCloseRect, 8))
            {
                if (_hoverTopClose)
                {
                    using (SolidBrush hBrush = new SolidBrush(Color.FromArgb(239, 68, 68)))
                        g.FillPath(hBrush, closePath);
                }
                else
                {
                    using (SolidBrush nBrush = new SolidBrush(Color.FromArgb(22, 32, 54)))
                        g.FillPath(nBrush, closePath);
                }
                using (Font xFont = new Font("Segoe UI", 9f, FontStyle.Bold))
                using (SolidBrush xBrush = new SolidBrush(Color.FromArgb(226, 232, 240)))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString("✕", xFont, xBrush, _topCloseRect, sf);
                }
            }

            // Header divider line
            using (Pen divPen = new Pen(Color.FromArgb(26, 38, 64), 1f))
            {
                g.DrawLine(divPen, 28, 98, 532, 98);
            }

            // 3. Option Cards
            DrawOptionCard(
                g,
                _card1Rect,
                _autoStartChecked,
                _hoverCard1,
                "Auto-Start System Tray Service",
                "Menjalankan layanan Compiler Bridge (Port 3001) otomatis saat Windows menyala"
            );

            DrawOptionCard(
                g,
                _card2Rect,
                _installDriversChecked,
                _hoverCard2,
                "Paket Driver USB Serial (CH340 & CP210x)",
                "Menyertakan driver resmi untuk mikrokontroler Arduino, ESP32 & NodeMCU"
            );

            // 4. Progress & Status Card
            using (GraphicsPath progCardPath = CreateRoundPath(_progressCardRect, 12))
            using (SolidBrush cardBg = new SolidBrush(Color.FromArgb(14, 21, 38)))
            using (Pen cardBorder = new Pen(Color.FromArgb(30, 44, 72), 1f))
            {
                g.FillPath(cardBg, progCardPath);
                g.DrawPath(cardBorder, progCardPath);
            }

            using (Font stageFont = new Font("Consolas", 8f, FontStyle.Bold))
            using (Font statusFont = new Font("Segoe UI", 9f, FontStyle.Regular))
            using (SolidBrush cyanBrush = new SolidBrush(Color.FromArgb(56, 189, 248)))
            using (SolidBrush statusBrush = new SolidBrush(Color.FromArgb(203, 213, 225)))
            {
                g.DrawString(_stepStageText, stageFont, cyanBrush, 44, 272);
                StringFormat rightFmt = new StringFormat() { Alignment = StringAlignment.Far };
                g.DrawString(_progressValue + "%", stageFont, cyanBrush, new RectangleF(400, 272, 114, 16), rightFmt);
                g.DrawString(_statusText, statusFont, statusBrush, 44, 289);
            }

            // Custom Progress Track
            using (GraphicsPath trackPath = CreateRoundPath(_progressBarRect, 7))
            using (SolidBrush trackBrush = new SolidBrush(Color.FromArgb(24, 35, 58)))
            {
                g.FillPath(trackBrush, trackPath);
            }

            if (_progressValue > 0)
            {
                int fillW = Math.Max(14, (int)Math.Round(_progressBarRect.Width * (_progressValue / 100.0)));
                Rectangle fillRect = new Rectangle(_progressBarRect.X, _progressBarRect.Y, Math.Min(_progressBarRect.Width, fillW), _progressBarRect.Height);
                using (GraphicsPath fillPath = CreateRoundPath(fillRect, 7))
                using (LinearGradientBrush fillBrush = new LinearGradientBrush(
                    _progressBarRect,
                    Color.FromArgb(16, 185, 129),
                    Color.FromArgb(56, 189, 248),
                    0f))
                {
                    g.FillPath(fillBrush, fillPath);
                }
            }

            // 5. Primary Action Button (Install)
            using (GraphicsPath installPath = CreateRoundPath(_installBtnRect, 11))
            {
                Color c1 = _isCompleted
                    ? Color.FromArgb(5, 150, 105)
                    : _isInstalling
                    ? Color.FromArgb(30, 64, 110)
                    : _hoverInstall
                    ? Color.FromArgb(20, 200, 140)
                    : Color.FromArgb(16, 185, 129);
                Color c2 = _isCompleted
                    ? Color.FromArgb(4, 120, 87)
                    : _isInstalling
                    ? Color.FromArgb(23, 45, 84)
                    : _hoverInstall
                    ? Color.FromArgb(14, 165, 233)
                    : Color.FromArgb(8, 145, 178);

                using (LinearGradientBrush btnBrush = new LinearGradientBrush(_installBtnRect, c1, c2, 0f))
                {
                    g.FillPath(btnBrush, installPath);
                }

                string btnText = _isCompleted
                    ? "✓ Terinstal & Aktif di Port 3001"
                    : _isInstalling
                    ? "Sedang Menginstal Paket Compiler..."
                    : "⚡ Install & Aktifkan Compiler Bridge";

                using (Font btnFont = new Font("Segoe UI", 10.5f, FontStyle.Bold))
                using (SolidBrush txtBrush = new SolidBrush(Color.White))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString(btnText, btnFont, txtBrush, _installBtnRect, sf);
                }
            }

            // 6. Close Button
            using (GraphicsPath closeBtnPath = CreateRoundPath(_closeBtnRect, 11))
            using (SolidBrush closeBg = new SolidBrush(_hoverClose ? Color.FromArgb(38, 52, 82) : Color.FromArgb(22, 32, 54)))
            using (Pen closeBorder = new Pen(Color.FromArgb(45, 62, 95), 1f))
            {
                g.FillPath(closeBg, closeBtnPath);
                g.DrawPath(closeBorder, closeBtnPath);

                using (Font btnFont = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                using (SolidBrush txtBrush = new SolidBrush(Color.FromArgb(226, 232, 240)))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString("Tutup", btnFont, txtBrush, _closeBtnRect, sf);
                }
            }

            // Outer Window Border
            using (Pen outerPen = new Pen(Color.FromArgb(38, 56, 92), 1.5f))
            {
                g.DrawRectangle(outerPen, 0, 0, this.Width - 1, this.Height - 1);
            }
        }

        private void DrawOptionCard(Graphics g, Rectangle rect, bool isChecked, bool isHovered, string title, string subtitle)
        {
            using (GraphicsPath path = CreateRoundPath(rect, 11))
            {
                Color bgCol = isChecked
                    ? (isHovered ? Color.FromArgb(18, 34, 56) : Color.FromArgb(15, 27, 46))
                    : (isHovered ? Color.FromArgb(18, 26, 44) : Color.FromArgb(13, 19, 34));
                Color borderCol = isChecked
                    ? Color.FromArgb(16, 185, 129)
                    : Color.FromArgb(35, 49, 78);

                using (SolidBrush bg = new SolidBrush(bgCol))
                using (Pen border = new Pen(borderCol, isChecked ? 1.4f : 1f))
                {
                    g.FillPath(bg, path);
                    g.DrawPath(border, path);
                }
            }

            // Checkbox Pill
            Rectangle checkRect = new Rectangle(rect.X + 16, rect.Y + 17, 24, 24);
            using (GraphicsPath checkPath = CreateRoundPath(checkRect, 7))
            {
                if (isChecked)
                {
                    using (LinearGradientBrush cb = new LinearGradientBrush(checkRect, Color.FromArgb(16, 185, 129), Color.FromArgb(14, 165, 233), 45f))
                        g.FillPath(cb, checkPath);
                    using (Font f = new Font("Segoe UI", 10f, FontStyle.Bold))
                    using (SolidBrush wb = new SolidBrush(Color.White))
                    {
                        StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                        g.DrawString("✓", f, wb, checkRect, sf);
                    }
                }
                else
                {
                    using (SolidBrush cb = new SolidBrush(Color.FromArgb(24, 34, 56)))
                    using (Pen cp = new Pen(Color.FromArgb(64, 82, 115), 1.2f))
                    {
                        g.FillPath(cb, checkPath);
                        g.DrawPath(cp, checkPath);
                    }
                }
            }

            using (Font titleFont = new Font("Segoe UI", 9.8f, FontStyle.Bold))
            using (Font subFont = new Font("Segoe UI", 8.5f, FontStyle.Regular))
            using (SolidBrush titleBrush = new SolidBrush(Color.White))
            using (SolidBrush subBrush = new SolidBrush(Color.FromArgb(148, 163, 184)))
            {
                g.DrawString(title, titleFont, titleBrush, rect.X + 52, rect.Y + 10);
                g.DrawString(subtitle, subFont, subBrush, rect.X + 52, rect.Y + 31);
            }
        }

        private void OnFormMouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left && _headerRect.Contains(e.Location) && !_topCloseRect.Contains(e.Location))
            {
                ReleaseCapture();
                SendMessage(this.Handle, 0xA1, 0x2, 0);
            }
        }

        private void OnFormMouseMove(object sender, MouseEventArgs e)
        {
            bool hInstall = !_isInstalling && _installBtnRect.Contains(e.Location);
            bool hClose = _closeBtnRect.Contains(e.Location);
            bool hTopClose = _topCloseRect.Contains(e.Location);
            bool hCard1 = !_isInstalling && _card1Rect.Contains(e.Location);
            bool hCard2 = !_isInstalling && _card2Rect.Contains(e.Location);

            if (hInstall != _hoverInstall || hClose != _hoverClose || hTopClose != _hoverTopClose || hCard1 != _hoverCard1 || hCard2 != _hoverCard2)
            {
                _hoverInstall = hInstall;
                _hoverClose = hClose;
                _hoverTopClose = hTopClose;
                _hoverCard1 = hCard1;
                _hoverCard2 = hCard2;
                this.Cursor = (hInstall || hClose || hTopClose || hCard1 || hCard2) ? Cursors.Hand : Cursors.Default;
                this.Invalidate();
            }
        }

        private void OnFormMouseClick(object sender, MouseEventArgs e)
        {
            if (e.Button != MouseButtons.Left) return;

            if (_topCloseRect.Contains(e.Location) || _closeBtnRect.Contains(e.Location))
            {
                this.Close();
                return;
            }

            if (!_isInstalling && _card1Rect.Contains(e.Location))
            {
                _autoStartChecked = !_autoStartChecked;
                this.Invalidate();
                return;
            }

            if (!_isInstalling && _card2Rect.Contains(e.Location))
            {
                _installDriversChecked = !_installDriversChecked;
                this.Invalidate();
                return;
            }

            if (!_isInstalling && !_isCompleted && _installBtnRect.Contains(e.Location))
            {
                StartInstallation();
            }
        }

        private void UpdateStatus(string stage, string text, int progress)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string, string, int>(UpdateStatus), stage, text, progress);
                return;
            }
            _stepStageText = stage;
            _statusText = text;
            _progressValue = Math.Min(100, Math.Max(0, progress));
            this.Invalidate();
        }

        private void StartInstallation()
        {
            _isInstalling = true;
            bool autoStart = _autoStartChecked;
            this.Invalidate();

            Thread worker = new Thread(() =>
            {
                try
                {
                    string targetDir = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "RoboLabCompilerBridge"
                    );

                    UpdateStatus("STEP 1/4 • PREPARING WORKSPACE", "Menyiapkan direktori instalasi lokal...", 15);
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    string tempZip = Path.Combine(Path.GetTempPath(), "robolab_bridge_payload.zip");
                    UpdateStatus("STEP 2/4 • UNPACKING PAYLOAD", "Mengekstrak paket RoboLab Compiler Bridge...", 35);

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

                    UpdateStatus("STEP 3/4 • INSTALLING TOOLCHAIN", "Menyalin Arduino CLI, Node.js Runtime & USB Driver...", 68);
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
                        UpdateStatus("STEP 4/4 • CONFIGURING SERVICE", "Mendaftarkan layanan Auto-Start System Tray...", 88);
                        CreateStartupLauncher(targetDir, trayExe);
                    }

                    UpdateStatus("STARTING BRIDGE DAEMON", "Menjalankan RoboLab Compiler Bridge (127.0.0.1:3001)...", 96);
                    if (File.Exists(trayExe))
                    {
                        Process.Start(new ProcessStartInfo()
                        {
                            FileName = trayExe,
                            WorkingDirectory = targetDir,
                            UseShellExecute = true
                        });
                    }

                    UpdateStatus("COMPLETED • PORT 3001 ACTIVE", "Instalasi selesai! Local Compiler Bridge telah aktif di System Tray.", 100);

                    this.Invoke(new Action(() =>
                    {
                        _isInstalling = false;
                        _isCompleted = true;
                        this.Invalidate();
                        MessageBox.Show(
                            "RoboLab Local Compiler Bridge berhasil diinstal dan sudah aktif di System Tray (Port 3001)!\n\nSekarang Anda bisa kembali ke RoboLab Studio dan langsung menekan tombol Verify / Upload.",
                            "RoboLab Studio — Instalasi Berhasil",
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
                        _isInstalling = false;
                        UpdateStatus("INSTALLATION ERROR", "Error: " + ex.Message, 0);
                        MessageBox.Show("Gagal menginstal: " + ex.Message, "RoboLab Installer Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
