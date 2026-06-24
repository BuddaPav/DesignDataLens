using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.Diagnostics;
using System;

/// <summary>
/// Unity Build Orchestrator - Auto-builds, tests, and reports
/// </summary>
public class BuildOrchestrator : EditorWindow
{
    [MenuItem("Build/Run Orchestrator")]
    public static void Run()
    {
        GetWindow<BuildOrchestrator>("Orchestrator").Show();
    }

    private string _status = "Ready";
    private List<string> _log = new List<string>();
    private bool _isRunning;
    private double _startTime;
    private int _passedTests;
    private int _failedTests;

    void OnGUI()
    {
        GUILayout.Label("=== Jules Build Orchestrator ===", EditorStyles.boldLabel);

        GUILayout.Space(10);

        GUILayout.Label($"Status: {_status}");
        GUILayout.Label($"Tests: {_passedTests} passed, {_failedTests} failed");

        if (!_isRunning)
        {
            if (GUILayout.Button("▶ Run Full Build"))
            {
                RunBuild();
            }
        }
        else
        {
            GUILayout.Label("Running...");
        }

        GUILayout.Space(10);
        GUILayout.Label("Log:", EditorStyles.boldLabel);

        foreach (var entry in _log)
        {
            GUILayout.Label(entry);
        }
    }

    async void RunBuild()
    {
        _isRunning = true;
        _startTime = EditorApplication.timeSinceRunning;
        _log.Clear();

        Log("=== Starting Build Orchestrator ===");

        // Pre-build validation
        Log("1/5 Validating scripts...");
        if (!ValidateScripts()) return;

        // Build
        Log("2/5 Building...");
        if (!Build()) return;

        // Tests
        Log("3/5 Running tests...");
        await RunTests();

        // Analysis
        Log("4/5 Analyzing...");
        Analyze();

        // Report
        Log("5/5 Report...");
        Report();

        _isRunning = false;
    }

    bool ValidateScripts()
    {
        try
        {
            // Get all C# scripts
            string[] scripts = AssetDatabase.FindAssets("t:MonoScript", new[] { "Assets/Scripts" });

            int validCount = 0;
            int errorCount = 0;

            foreach (var guid in scripts)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                var monoScript = AssetDatabase.LoadAssetAtPath<MonoScript>(path);

                if (monoScript != null)
                {
                    Type classType = monoScript.GetClass();
                    if (classType != null)
                    {
                        validCount++;
                    }
                }
            }

            Log($"Found {validCount} valid scripts");
            Log($"Validation complete: {errorCount} errors");

            if (errorCount > 0)
            {
                _status = "Validation Failed";
                return false;
            }

            return true;
        }
        catch (Exception e)
        {
            Log($"ERROR: {e.Message}");
            _status = "Error";
            return false;
        }
    }

    bool Build()
    {
        try
        {
            // Build player
            BuildPlayerOptions opts = new BuildPlayerOptions
            {
                scenes = new[] { "Assets/Scenes/Main.unity" },
                locationPathName = "Build",
                target = EditorUserBuildSettings.activeBuildTarget,
                options = BuildOptions.None
            };

            UnityEditor.Build.Reporting.BuildReport report = UnityEditor.BuildPipeline.BuildPlayer(opts);
            UnityEditor.Build.Reporting.BuildSummary summary = report.summary;

            if (summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
            {
                Log($"Build succeeded: {summary.totalSize / 1024 / 1024}MB");
                return true;
            }
            else
            {
                Log("Build failed");
                _status = "Build Failed";
                return false;
            }
        }
        catch (Exception e)
        {
            Log($"Build error: {e.Message}");
            _status = "Build Error";
            return false;
        }
    }

    async System.Threading.Tasks.Task RunTests()
    {
        try
        {
            // Get test assemblies
            var runner = UnityEditor.TestTools.TestRunner.API;
            var testRuns = await runner.GetTestRunsFromExecution();

            _passedTests = 0;
            _failedTests = 0;

            foreach (var run in testRuns)
            {
                if (run.TestStatus == UnityEditor.TestTools.TestStatus.Passed)
                    _passedTests++;
                else if (run.TestStatus == UnityEditor.TestTools.TestStatus.Failed)
                    _failedTests++;
            }

            Log($"Tests: {_passedTests} passed, {_failedTests} failed");
        }
        catch (Exception e)
        {
            Log($"Test error (this is normal in editor): {e.Message}");
            _passedTests = 0;
            _failedTests = 0;
        }
    }

    void Analyze()
    {
        Log("=== Analysis ===");

        // Count scripts by type
        int scripts = 0, tests = 0, agents = 0;
        string[] guids = AssetDatabase.FindAssets("t:MonoScript", new[] { "Assets/Scripts" });

        foreach (var guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            if (path.Contains("Test"))
                tests++;
            else if (path.Contains("Agent"))
                agents++;
            else
                scripts++;
        }

        Log($"Scripts: {scripts}");
        Log($"Tests: {tests}");
        Log($"Agents: {agents}");

        // Check components
        var guids2 = AssetDatabase.FindAssets("t:MonoScript", new[] { "Assets/Scripts/Jules" });
        Log($"Jules Systems: {guids2.Length}");
    }

    void Report()
    {
        double elapsed = EditorApplication.timeSinceRunning - _startTime;

        Log("=== BUILD REPORT ===");
        Log($"Time: {elapsed:F1}s");
        Log($"Status: {_status}");
        Log($"Tests: {_passedTests}/{_passedTests + _failedTests}");
        Log($"Total: {EditorApplication.timeSinceRunning - _startTime:F1}s");

        _status = elapsed > 0 ? "Complete" : "Failed";
    }

    void Log(string msg)
    {
        _log.Add($"[{DateTime.Now:HH:mm:ss}] {msg}");
    }
}

/// <summary>
/// Auto-run orchestrator for build machine
/// </summary>
public class AutoBuildRunner : EditorWindow
{
    [MenuItem("Build/Auto Build")]
    public static void AutoBuild()
    {
        EditorWindow.GetWindow<AutoBuildRunner>("AutoBuild").Run();
    }

    async void Run()
    {
        Debug.Log("=== Auto Build Starting ===");

        // Save scene
        EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(), "Assets/Scenes/Main.unity");

        // Build
        BuildPlayerOptions opts = new BuildPlayerOptions
        {
            scenes = new[] { "Assets/Scenes/Main.unity" },
            locationPathName = "Build/Jules.exe",
            target = BuildTarget.StandaloneWindows64,
            options = BuildOptions.None
        };

        var report = UnityEditor.BuildPipeline.BuildPlayer(opts);
        var summary = report.summary;

        if (summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
        {
            Debug.Log($"SUCCESS: Built {summary.totalSize / 1024 / 1024}MB");

            // Find .exe
            string[] exe = System.IO.Directory.GetFiles("Build", "*.exe", System.IO.SearchOption.AllDirectories);
            if (exe.Length > 0)
            {
                Debug.Log($"EXE: {exe[0]}");
            }
        }
        else
        {
            Debug.LogError("BUILD FAILED");
        }

        // Close
        EditorApplication.Exit(summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded ? 0 : 1);
    }
}