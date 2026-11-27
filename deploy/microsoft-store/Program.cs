using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Web.Script.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace AfterYou.Windows;
internal static class Program
{
    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new GameWindow());
    }
}
internal sealed class GameWindow : Form
{
    private const string LocalHost = "game.afteryou.invalid";
    private readonly WebView2 view = new() { Dock = DockStyle.Fill };
    private readonly Label loading = new() { Dock = DockStyle.Fill, Text = "구름 정거장을 준비하고 있어요…", TextAlign = ContentAlignment.MiddleCenter };
    private readonly HttpClient api = new(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(10) };
    private readonly Uri service;
    private Rectangle previousBounds;
    private FormWindowState previousState;
    private bool fullscreen;
    private static readonly Regex ApiPath = new(@"^/api/(?:health|leaderboard|runs(?:/[a-fA-F0-9-]{36}/checkpoint)?)$", RegexOptions.Compiled);
    public GameWindow()
    {
        Text = "먼저 가세요 · AFTER YOU";
        BackColor = Color.FromArgb(250, 246, 237);
        ClientSize = new Size(480, 850);
        MinimumSize = new Size(340, 600);
        StartPosition = FormStartPosition.CenterScreen;
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        var identity = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "identity.json")));
        service = new Uri((string)identity["serviceOrigin"]);
        if (service.Scheme != "https" || !string.IsNullOrEmpty(service.UserInfo) || service.AbsolutePath != "/") throw new InvalidDataException("Invalid service origin");
        Controls.Add(view); Controls.Add(loading);
        Shown += async (_, _) => await StartGame();
    }
    private async Task StartGame()
    {
        try
        {
            var web = Path.Combine(AppContext.BaseDirectory, "Web");
            if (!File.Exists(Path.Combine(web, "index.html"))) throw new FileNotFoundException("Bundled game missing");
            var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Carzero", "AfterYou", "WebView2");
            var environment = await CoreWebView2Environment.CreateAsync(null, profile);
            await view.EnsureCoreWebView2Async(environment);
            var core = view.CoreWebView2;
            core.SetVirtualHostNameToFolderMapping(LocalHost, web, CoreWebView2HostResourceAccessKind.DenyCors);
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsWebMessageEnabled = false;
            core.Settings.IsZoomControlEnabled = false;
            core.AddWebResourceRequestedFilter($"https://{LocalHost}/api/*", CoreWebView2WebResourceContext.All);
            core.WebResourceRequested += ForwardApi;
            core.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
            core.NewWindowRequested += (_, e) => { e.Handled = true; OpenExternal(e.Uri); };
            core.NavigationStarting += (_, e) => { if (!IsGameAddress(e.Uri)) { e.Cancel = true; OpenExternal(e.Uri); } };
            core.NavigationCompleted += (_, e) => { loading.Visible = !e.IsSuccess; if (!e.IsSuccess) loading.Text = "게임을 열지 못했어요. 창을 닫고 다시 실행해 주세요."; };
            core.ProcessFailed += (_, _) => { loading.Text = "화면을 다시 열고 있어요…"; loading.Visible = true; core.Reload(); };
            view.KeyDown += (_, e) => { if (e.KeyCode == Keys.F11) { e.Handled = true; e.SuppressKeyPress = true; ToggleFullscreen(); } };
            core.Navigate($"https://{LocalHost}/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            loading.Text = "Microsoft Edge WebView2가 필요합니다.";
            if (MessageBox.Show(this, "게임을 실행하려면 Microsoft Edge WebView2 Runtime이 필요합니다. 공식 설치 안내를 열까요?", Text, MessageBoxButtons.YesNo, MessageBoxIcon.Information) == DialogResult.Yes)
                OpenExternal("https://developer.microsoft.com/microsoft-edge/webview2/");
        }
        catch
        {
            loading.Text = "게임을 준비하지 못했어요. 앱을 다시 설치한 뒤 실행해 주세요.";
        }
    }
    private static bool IsGameAddress(string value) => Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == "https" && uri.Host == LocalHost && uri.IsDefaultPort && string.IsNullOrEmpty(uri.UserInfo);
    private static void OpenExternal(string value)
    {
        if (Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == "https" && string.IsNullOrEmpty(uri.UserInfo))
            try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); } catch { }
    }
    private async void ForwardApi(object? sender, CoreWebView2WebResourceRequestedEventArgs e)
    {
        using var deferral = e.GetDeferral();
        try
        {
            var uri = new Uri(e.Request.Uri);
            if (uri.Host != LocalHost || !ApiPath.IsMatch(uri.AbsolutePath) || !new[] { "GET", "POST" }.Contains(e.Request.Method))
            { Respond(e, 403, "Forbidden", "{\"error\":\"요청을 처리할 수 없어요.\"}"); return; }
            using var request = new HttpRequestMessage(new HttpMethod(e.Request.Method), new Uri(service, uri.PathAndQuery));
            request.Headers.TryAddWithoutValidation("Origin", service.GetLeftPart(UriPartial.Authority));
            if (e.Request.Method == "POST")
            {
                using var data = new MemoryStream();
                var buffer = new byte[8192]; int read;
                if (e.Request.Content is { } input)
                    while ((read = await input.ReadAsync(buffer, 0, buffer.Length)) > 0)
                    { if (data.Length + read > 64000) { Respond(e, 413, "Payload Too Large", "{}"); return; } data.Write(buffer, 0, read); }
                request.Content = new ByteArrayContent(data.ToArray());
                request.Content.Headers.ContentType = new("application/json");
            }
            using var response = await api.SendAsync(request);
            var bytes = await response.Content.ReadAsByteArrayAsync();
            e.Response = view.CoreWebView2.Environment.CreateWebResourceResponse(new MemoryStream(bytes), (int)response.StatusCode, response.ReasonPhrase ?? "Response", "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store");
        }
        catch { Respond(e, 503, "Service Unavailable", "{\"error\":\"지금은 온라인 도전을 이용할 수 없어요.\"}"); }
    }
    private void Respond(CoreWebView2WebResourceRequestedEventArgs e, int status, string reason, string json)
    {
        if (IsDisposed || Disposing || view.IsDisposed || view.CoreWebView2 is null) return;
        try { e.Response = view.CoreWebView2.Environment.CreateWebResourceResponse(new MemoryStream(Encoding.UTF8.GetBytes(json)), status, reason, "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store"); } catch (ObjectDisposedException) { }
    }
    private void ToggleFullscreen()
    {
        if (!fullscreen) { previousBounds = Bounds; previousState = WindowState; WindowState = FormWindowState.Normal; FormBorderStyle = FormBorderStyle.None; Bounds = Screen.FromControl(this).Bounds; }
        else { FormBorderStyle = FormBorderStyle.Sizable; Bounds = previousBounds; WindowState = previousState; }
        fullscreen = !fullscreen;
    }
    protected override void Dispose(bool disposing)
    {
        if (disposing) { api.Dispose(); view.Dispose(); }
        base.Dispose(disposing);
    }
}
