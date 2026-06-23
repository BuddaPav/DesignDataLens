using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// NPC Manager for AFK Game
/// Manages NPCs, their states, schedules, and dialogs
/// </summary>
public class NPCManager : MonoBehaviour
{
    [Header("NPC Settings")]
    [SerializeField] private int _maxActiveNPCs = 10;
    [SerializeField] private float _awarenessRadius = 3.0f;

    [Header("NPC Database")]
    [SerializeField] private NPCData[] _npcDatabase;

    private Dictionary<string, NPC> _activeNPCs = new Dictionary<string, NPC>();
    private List<NPC> _spawnedNPCs = new List<NPC>();

    void Awake()
    {
        LoadNPCDatabase();
    }

    void LoadNPCDatabase()
    {
        if (_npcDatabase == null || _npcDatabase.Length == 0)
        {
            // Default NPCs
            _npcDatabase = new NPCData[]
            {
                new NPCData { id = "npc_wizard", name = "Eldric", role = "Wizard", greeting = "Greetings, traveler!" },
                new NPCData { id = "npc_merchant", name = "Brom", role = "Merchant", greeting = "Welcome to my shop!" },
                new NPCData { id = "npc_guard", name = "Captain Marcus", role = "Guard", greeting = "Keep the peace!" }
            };
        }
    }

    public void OnTick()
    {
        // Update NPC states
        foreach (var npc in _spawnedNPCs)
        {
            npc.OnTick();
        }
    }

    public NPC SpawnNPC(string npcId, Vector3 position)
    {
        if (_spawnedNPCs.Count >= _maxActiveNPCs)
        {
            Debug.LogWarning("Max NPCs reached");
            return null;
        }

        NPCData data = GetNPCData(npcId);
        if (data == null)
        {
            Debug.LogError($"NPC not found: {npcId}");
            return null;
        }

        // Create NPC game object
        GameObject npcObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        npcObj.name = data.name;
        npcObj.transform.position = position;

        NPC npc = npcObj.AddComponent<NPC>();
        npc.Initialize(data);

        _spawnedNPCs.Add(npc);
        return npc;
    }

    NPCData GetNPCData(string id)
    {
        foreach (var data in _npcDatabase)
        {
            if (data.id == id) return data;
        }
        return null;
    }

    public NPC[] GetNearbyNPCs(Vector3 position)
    {
        List<NPC> nearby = new List<NPC>();
        foreach (var npc in _spawnedNPCs)
        {
            if (Vector3.Distance(position, npc.transform.position) <= _awarenessRadius)
            {
                nearby.Add(npc);
            }
        }
        return nearby.ToArray();
    }
}

/// <summary>
/// NPC data from database
/// </summary>
[System.Serializable]
public class NPCData
{
    public string id;
    public string name;
    public string role;
    public string greeting;
}

/// <summary>
/// Individual NPC with state
/// </summary>
public class NPC : MonoBehaviour
{
    private NPCData _data;
    private NPCState _state;
    private float _idleTimer;

    public void Initialize(NPCData data)
    {
        _data = data;
        _state = new NPCState
        {
            mood = "neutral",
            lastGreeting = ""
        };
    }

    public void OnTick()
    {
        // Update idle timer
        _idleTimer += Time.deltaTime;

        // State transitions
        if (_idleTimer > 10.0f)
        {
            _state.mood = "bored";
        }
    }

    public string GetDialog(PlayerSystem player)
    {
        _idleTimer = 0;
        _state.mood = "friendly";
        _state.lastGreeting = _data.greeting;
        return _data.greeting;
    }
}

/// <summary>
/// NPC state
/// </summary>
[System.Serializable]
public class NPCState
{
    public string mood;
    public string lastGreeting;
}