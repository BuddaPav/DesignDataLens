using UnityEngine;

/// <summary>
/// Main game manager for AFK Game
/// Handles game state, time progression, and world ticks
/// </summary>
public class GameManager : MonoBehaviour
{
    private static GameManager _instance;
    public static GameManager Instance => _instance;

    [Header("World Settings")]
    [SerializeField] private float _tickRate = 1.0f; // 1 second per tick
    private float _tickTimer;

    [Header("Game State")]
    [SerializeField] private bool _isPaused;
    [SerializeField] private int _worldTime; // in seconds

    // Game systems
    private PlayerSystem _playerSystem;
    private NPCManager _npcManager;
    private QuestManager _questManager;

    void Awake()
    {
        if (_instance == null)
        {
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
            return;
        }

        InitializeSystems();
    }

    void InitializeSystems()
    {
        _playerSystem = FindObjectOfType<PlayerSystem>();
        _npcManager = FindObjectOfType<NPCManager>();
        _questManager = FindObjectOfType<QuestManager>();

        if (_playerSystem == null)
            Debug.LogWarning("PlayerSystem not found!");
        if (_npcManager == null)
            Debug.LogWarning("NPCManager not found!");
        if (_questManager == null)
            Debug.LogWarning("QuestManager not found!");
    }

    void Update()
    {
        if (_isPaused) return;

        // World tick system
        _tickTimer += Time.deltaTime;
        if (_tickTimer >= _tickRate)
        {
            OnWorldTick();
            _tickTimer = 0;
        }
    }

    void OnWorldTick()
    {
        _worldTime++;

        // Update NPCs
        if (_npcManager != null)
        {
            _npcManager.OnTick();
        }

        // Update quests
        if (_questManager != null)
        {
            _questManager.OnTick();
        }
    }

    public void Pause() => _isPaused = true;
    public void Resume() => _isPaused = false;
    public bool IsPaused => _isPaused;
    public int GetWorldTime() => _worldTime;
}