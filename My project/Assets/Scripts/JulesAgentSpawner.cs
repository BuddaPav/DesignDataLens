using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Jules Agent Spawner - Auto-spawns autonomous AI agents
/// </summary>
public class JulesAgentSpawner : MonoBehaviour
{
    [Header("Agent Prefabs")]
    [SerializeField] private GameObject _warriorPrefab;
    [SerializeField] private GameObject _healerPrefab;
    [SerializeField] private GameObject _merchantPrefab;
    [SerializeField] private GameObject _farmerPrefab;

    [Header("Spawn Settings")]
    [SerializeField] private int _warriorCount = 2;
    [SerializeField] private int _healerCount = 1;
    [SerializeField] private int _merchantCount = 2;
    [SerializeField] private int _farmerCount = 3;

    [Header("Spawn Areas")]
    [SerializeField] private Vector3 _warriorArea = new Vector3(5, 1, 5);
    [SerializeField] private Vector3 _healerArea = new Vector3(-3, 1, 3);
    [SerializeField] private Vector3 _merchantArea = new Vector3(0, 1, 0);
    [SerializeField] private Vector3 _farmerArea = new Vector3(-8, 1, -5);

    [Header("Spawned Agents")]
    [SerializeField] private List<JulesAIAgent> _spawnedAgents = new List<JulesAIAgent>();

    void Start()
    {
        SpawnAllAgents();
    }

    void SpawnAllAgents()
    {
        // Spawn Warriors
        for (int i = 0; i < _warriorCount; i++)
        {
            SpawnAgent(_warriorPrefab, _warriorArea + GetRandomOffset(), "Warrior");
        }

        // Spawn Healers
        for (int i = 0; i < _healerCount; i++)
        {
            SpawnAgent(_healerPrefab, _healerArea + GetRandomOffset(), "Healer");
        }

        // Spawn Merchants
        for (int i = 0; i < _merchantCount; i++)
        {
            SpawnAgent(_merchantPrefab, _merchantArea + GetRandomOffset(), "Merchant");
        }

        // Spawn Farmers
        for (int i = 0; i < _farmerCount; i++)
        {
            SpawnAgent(_farmerPrefab, _farmerArea + GetRandomOffset(), "Farmer");
        }

        Debug.Log($"Spawned {_spawnedAgents.Count} AI agents");
    }

    JulesAIAgent SpawnAgent(GameObject prefab, Vector3 position, string role)
    {
        GameObject agentObj;
        if (prefab != null)
        {
            agentObj = Instantiate(prefab, position, Quaternion.identity);
        }
        else
        {
            // Create from scratch
            agentObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            agentObj.transform.position = position;

            // Add agent component based on role
            JulesAIAgent agent = role switch
            {
                "Warrior" => agentObj.AddComponent<JulesWarriorAgent>(),
                "Healer" => agentObj.AddComponent<JulesHealerAgent>(),
                "Merchant" => agentObj.AddComponent<JulesMerchantAgent>(),
                "Farmer" => agentObj.AddComponent<JulesFarmerAgent>(),
                _ => agentObj.AddComponent<JulesAIAgent>()
            };
        }

        agentObj.name = $"{role}_{_spawnedAgents.Count}";
        JulesAIAgent agentComp = agentObj.GetComponent<JulesAIAgent>();
        if (agentComp != null)
        {
            _spawnedAgents.Add(agentComp);
        }

        return agentComp;
    }

    Vector3 GetRandomOffset()
    {
        return new Vector3(Random.Range(-3f, 3f), 0, Random.Range(-3f, 3f));
    }

    public List<JulesAIAgent> GetAgents()
    {
        return _spawnedAgents;
    }

    public JulesAIAgent GetNearestAgent(Vector3 position, string role = null)
    {
        JulesAIAgent nearest = null;
        float minDist = float.MaxValue;

        foreach (var agent in _spawnedAgents)
        {
            if (agent == null) continue;
            if (role != null && agent.AgentRole != role) continue;

            float dist = Vector3.Distance(position, agent.transform.position);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = agent;
            }
        }

        return nearest;
    }

    public List<JulesAIAgent> GetAgentsByRole(string role)
    {
        List<JulesAIAgent> result = new List<JulesAIAgent>();
        foreach (var agent in _spawnedAgents)
        {
            if (agent != null && agent.AgentRole == role)
            {
                result.Add(agent);
            }
        }
        return result;
    }
}