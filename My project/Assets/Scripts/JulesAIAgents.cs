using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Jules AI Agent System - Autonomous agents that perform tasks without player commands
/// </summary>
public class JulesAIAgent : MonoBehaviour
{
    [Header("Agent Identity")]
    [SerializeField] private string _agentName;
    [SerializeField] private string _agentRole;
    [SerializeField] private int _autonomyLevel = 1; // 1-5

    [Header("Mental State")]
    [SerializeField] private string _currentGoal;
    [SerializeField] private float _motivation = 0.8f;
    [SerializeField] private float _stress = 0f;
    [SerializeField] private float _happiness = 0.7f;

    [Header("Memory")]
    [SerializeField] private List<string> _memories = new List<string>();
    [SerializeField] private List<string> _completedTasks = new List<string>();

    [Header("Capabilities")]
    [SerializeField] private bool _canMove = true;
    [SerializeField] private bool _canAttack = false;
    [SerializeField] private bool _canTrade = true;
    [SerializeField] private bool _canHeal = false;
    [SerializeField] private bool _canGather = true;
    [SerializeField] private bool _canCraft = false;

    protected float _decisionTimer;
    protected float _actionTimer;
    protected Vector3 _targetPosition;
    protected bool _isBusy;

    public string AgentName => _agentName;
    public string AgentRole => _agentRole;
    public string CurrentGoal => _currentGoal;
    public float Motivation => _motivation;
    public bool IsBusy => _isBusy;

    protected virtual void Start()
    {
        _decisionTimer = Random.Range(2f, 5f);
        _actionTimer = 0f;
        InitializeAgent();
    }

    protected virtual void InitializeAgent()
    {
        _currentGoal = GenerateGoal();
    }

    void Update()
    {
        if (_autonomyLevel <= 0) return;

        // Think and decide
        _decisionTimer -= Time.deltaTime;
        if (_decisionTimer <= 0)
        {
            Think();
            _decisionTimer = Random.Range(2f, 6f);
        }

        // Act
        if (_isBusy)
        {
            PerformAction();
        }
        else
        {
            ExecuteCurrentGoal();
        }

        // Update mental state
        UpdateMentalState();
    }

    /// <summary>
    /// Agent thinks and decides what to do
    /// </summary>
    protected virtual void Think()
    {
        // Check environment
        bool playerNearby = IsPlayerNearby(10f);
        bool enemyNearby = IsEnemyNearby(8f);
        bool hasResources = CheckResources();
        bool isInjured = CheckHealth();

        // Make decision based on role and situation
        if (enemyNearby && _canAttack)
        {
            DecideToFight();
        }
        else if (isInjured && _canHeal)
        {
            DecideToHeal();
        }
        else if (playerNearby && _canTrade && _agentRole == "Merchant")
        {
            DecideToTrade();
        }
        else if (!hasResources && _canGather)
        {
            DecideToGather();
        }
        else if (!string.IsNullOrEmpty(_currentGoal))
        {
            // Continue current goal
        }
        else
        {
            _currentGoal = GenerateGoal();
        }

        LogThought();
    }

    protected virtual void DecideToFight()
    {
        _currentGoal = "combat";
        _motivation = Mathf.Min(1f, _motivation + 0.2f);
    }

    protected virtual void DecideToHeal()
    {
        _currentGoal = "heal";
    }

    protected virtual void DecideToTrade()
    {
        _currentGoal = "trade";
    }

    protected virtual void DecideToGather()
    {
        _currentGoal = "gather";
    }

    protected virtual string GenerateGoal()
    {
        string[] goals = _agentRole switch
        {
            "Merchant" => new[] { "trade", "restock", "advertise" },
            "Farmer" => new[] { "plant", "harvest", "tend" },
            "Guard" => new[] { "patrol", "train", "watch" },
            "Healer" => new[] { "heal", "gather_herbs", "research" },
            "Blacksmith" => new[] { "craft", "gather_ore", "repair" },
            _ => new[] { "patrol", "explore", "rest", "socialize" }
        };

        return goals[Random.Range(0, goals.Length)];
    }

    protected virtual void ExecuteCurrentGoal()
    {
        if (string.IsNullOrEmpty(_currentGoal)) return;

        switch (_currentGoal)
        {
            case "combat":
                ExecuteCombat();
                break;
            case "gather":
            case "plant":
            case "harvest":
                ExecuteGather();
                break;
            case "trade":
                ExecuteTrade();
                break;
            case "heal":
                ExecuteHeal();
                break;
            case "patrol":
                ExecutePatrol();
                break;
            case "explore":
                ExecuteExplore();
                break;
            case "rest":
                ExecuteRest();
                break;
            case "socialize":
                ExecuteSocialize();
                break;
            default:
                _currentGoal = "";
                break;
        }
    }

    protected virtual void ExecuteCombat()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        var enemies = FindObjectsOfComponent<JulesEnemy>();
        JulesEnemy nearest = null;
        float minDist = float.MaxValue;

        foreach (var enemy in enemies)
        {
            float d = Vector3.Distance(transform.position, enemy.transform.position);
            if (d < minDist)
            {
                minDist = d;
                nearest = enemy;
            }
        }

        if (nearest != null && minDist < 8f)
        {
            Vector3 dir = (nearest.transform.position - transform.position).normalized;
            transform.position += dir * 3f * Time.deltaTime;
        }
    }

    protected virtual void ExecuteGather()
    {
        // Find resources in world
        Vector3 gatherSpot = FindResourceLocation();
        if (gatherSpot != Vector3.zero)
        {
            float dist = Vector3.Distance(transform.position, gatherSpot);
            if (dist > 1f)
            {
                Vector3 dir = (gatherSpot - transform.position).normalized;
                transform.position += dir * 2f * Time.deltaTime;
            }
            else
            {
                // Gather
                string resource = _currentGoal == "gather" ? "herb" : "ore";
                AddMemory($"Gathered {resource}");
                _isBusy = true;
                _actionTimer = 2f;
            }
        }
    }

    protected virtual void ExecuteTrade()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        float dist = Vector3.Distance(transform.position, player.transform.position);
        if (dist < 3f)
        {
            // Trade with player
            if (Random.value < 0.3f)
            {
                AddMemory("Traded with player");
                _happiness = Mathf.Min(1f, _happiness + 0.1f);
            }
            _isBusy = true;
            _actionTimer = 1f;
        }
        else
        {
            // Move toward player
            Vector3 dir = (player.transform.position - transform.position).normalized;
            transform.position += dir * 2.5f * Time.deltaTime;
        }
    }

    protected virtual void ExecuteHeal()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        if (player.Health < player.MaxHealth * 0.5f)
        {
            float dist = Vector3.Distance(transform.position, player.transform.position);
            if (dist < 3f)
            {
                player.Heal(20);
                AddMemory("Healed player");
                _motivation -= 0.1f;
            }
            else
            {
                MoveToTarget(player.transform.position);
            }
        }
    }

    protected virtual void ExecutePatrol()
    {
        // Patrol around spawn point
        Vector3 home = _targetPosition;
        float dist = Vector3.Distance(transform.position, home);

        if (dist > 5f)
        {
            MoveToTarget(home);
        }
        else
        {
            // Random patrol
            Vector3 randomOffset = new Vector3(Random.Range(-3f, 3f), 0, Random.Range(-3f, 3f));
            MoveToTarget(home + randomOffset);
            _isBusy = true;
            _actionTimer = 3f;
        }
    }

    protected virtual void ExecuteExplore()
    {
        // Explore in random direction
        Vector3 target = transform.position + new Vector3(Random.Range(-10f, 10f), 0, Random.Range(-10f, 10f));
        MoveToTarget(target);

        if (Random.value < 0.1f)
        {
            AddMemory("Found new area");
        }
    }

    protected virtual void ExecuteRest()
    {
        _motivation = Mathf.Min(1f, _motivation + 0.01f);
        _stress = Mathf.Max(0, _stress - 0.01f);

        if (_motivation > 0.9f)
        {
            _currentGoal = GenerateGoal();
        }
    }

    protected virtual void ExecuteSocialize()
    {
        var otherAgents = FindObjectsOfComponent<JulesAIAgent>();
        JulesAIAgent nearest = null;
        float minDist = float.MaxValue;

        foreach (var agent in otherAgents)
        {
            if (agent == this) continue;
            float d = Vector3.Distance(transform.position, agent.transform.position);
            if (d < minDist)
            {
                minDist = d;
                nearest = agent;
            }
        }

        if (nearest != null && minDist > 2f)
        {
            MoveToTarget(nearest.transform.position);
        }
        else if (nearest != null)
        {
            // Talk
            AddMemory($"Spoke with {nearest.AgentName}");
            nearest.ReceiveMemory($"{AgentName} said hello");
            _happiness = Mathf.Min(1f, _happiness + 0.1f);
            _isBusy = true;
            _actionTimer = 2f;
        }
    }

    protected virtual void PerformAction()
    {
        _actionTimer -= Time.deltaTime;
        if (_actionTimer <= 0)
        {
            _isBusy = false;
            _currentGoal = GenerateGoal();
        }
    }

    protected virtual void MoveToTarget(Vector3 target)
    {
        Vector3 dir = (target - transform.position).normalized;
        transform.position += dir * (_canAttack ? 3f : 2f) * Time.deltaTime;
    }

    protected virtual void UpdateMentalState()
    {
        // Stress from being busy
        if (_isBusy)
        {
            _motivation = Mathf.Max(0, _motivation - 0.001f);
        }
        else
        {
            _motivation = Mathf.Min(1f, _motivation + 0.002f);
        }

        // Happiness decay
        _happiness = Mathf.Max(0, _happiness - 0.0001f);
    }

    protected bool IsPlayerNearby(float radius)
    {
        var player = JulesPlayerController.Instance;
        return player != null && Vector3.Distance(transform.position, player.transform.position) < radius;
    }

    protected bool IsEnemyNearby(float radius)
    {
        var enemies = FindObjectsOfComponent<JulesEnemy>();
        foreach (var enemy in enemies)
        {
            if (Vector3.Distance(transform.position, enemy.transform.position) < radius)
                return true;
        }
        return false;
    }

    protected bool CheckResources()
    {
        return _memories.Count < 10;
    }

    protected bool CheckHealth()
    {
        var player = JulesPlayerController.Instance;
        return player == null || player.Health > player.MaxHealth * 0.3f;
    }

    protected Vector3 FindResourceLocation()
    {
        // Simplified - find random resource spot
        return transform.position + new Vector3(Random.Range(-5f, 5f), 0, Random.Range(-5f, 5f));
    }

    public virtual void AddMemory(string memory)
    {
        _memories.Add($"{System.DateTime.Now.Hour}:{System.DateTime.Now.Minute} - {memory}");
        if (_memories.Count > 20)
        {
            _memories.RemoveAt(0);
        }
    }

    public virtual void ReceiveMemory(string memory)
    {
        _memories.Add($"[Heard] {memory}");
    }

    public void SetTargetPosition(Vector3 pos)
    {
        _targetPosition = pos;
    }

    protected void LogThought()
    {
        if (_autonomyLevel >= 3)
        {
            Debug.Log($"[{AgentName}] Thinking: {_currentGoal} (motivation: {_motivation:F2})");
        }
    }
}

/// <summary>
/// Jules AI Agent - Warrior (combat-focused)
/// </summary>
public class JulesWarriorAgent : JulesAIAgent
{
    protected override void InitializeAgent()
    {
        _canAttack = true;
        _canMove = true;
        _autonomyLevel = 4;
        _agentName = name + "_Warrior";
        _agentRole = "Guard";
        _currentGoal = "patrol";
    }

    protected override void DecideToFight()
    {
        _currentGoal = "combat";
    }

    protected override void ExecuteCombat()
    {
        var enemies = FindObjectsOfComponent<JulesEnemy>();
        JulesEnemy target = null;
        float minDist = float.MaxValue;

        foreach (var enemy in enemies)
        {
            float d = Vector3.Distance(transform.position, enemy.transform.position);
            if (d < minDist)
            {
                minDist = d;
                target = enemy;
            }
        }

        if (target != null && minDist < 10f)
        {
            // Chase and attack
            Vector3 dir = (target.transform.position - transform.position).normalized;
            transform.position += dir * 4f * Time.deltaTime;

            if (minDist < 2f)
            {
                target.TakeDamage(5);
                _isBusy = true;
                _actionTimer = 1f;
            }
        }
    }
}

/// <summary>
/// Jules AI Agent - Healer (support-focused)
/// </summary>
public class JulesHealerAgent : JulesAIAgent
{
    protected override void InitializeAgent()
    {
        _canHeal = true;
        _canGather = true;
        _canMove = true;
        _autonomyLevel = 3;
        _agentName = name + "_Healer";
        _agentRole = "Healer";
        _currentGoal = "gather_herbs";
    }

    protected override void DecideToHeal()
    {
        _currentGoal = "heal";
    }

    protected override void ExecuteHeal()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        if (player.Health < player.MaxHealth)
        {
            float dist = Vector3.Distance(transform.position, player.transform.position);
            if (dist < 4f)
            {
                player.Heal(15);
                AddMemory("Healed wounded");
                _happiness = Mathf.Min(1f, _happiness + 0.15f);
            }
            else
            {
                MoveToTarget(player.transform.position);
            }
        }

        // Also heal self
        if (_motivation < 0.3f)
        {
            _motivation += 0.1f;
        }
    }

    protected override void ExecuteGather()
    {
        // Healing herbs location
        Vector3 herbSpot = FindHerbLocation();
        float dist = Vector3.Distance(transform.position, herbSpot);

        if (dist > 0.5f)
        {
            MoveToTarget(herbSpot);
        }
        else
        {
            AddMemory("Gathered healing herbs");
            _isBusy = true;
            _actionTimer = 3f;
            _motivation += 0.1f;
        }
    }

    Vector3 FindHerbLocation()
    {
        return transform.position + new Vector3(Random.Range(-8f, 8f), 0, Random.Range(-8f, 8f));
    }
}

/// <summary>
/// Jules AI Agent - Merchant (trade-focused)
/// </summary>
public class JulesMerchantAgent : JulesAIAgent
{
    private int _gold = 100;
    private int _inventory = 5;

    protected override void InitializeAgent()
    {
        _canTrade = true;
        _canMove = true;
        _autonomyLevel = 4;
        _agentName = name + "_Merchant";
        _agentRole = "Merchant";
        _currentGoal = "trade";
    }

    protected override void ExecuteTrade()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        float dist = Vector3.Distance(transform.position, player.transform.position);
        if (dist < 3f)
        {
            // Attempt trade
            if (_inventory > 0 && player.Gold >= 10)
            {
                _inventory--;
                _gold += 10;
                AddMemory("Sold item for 10 gold");
                _happiness = Mathf.Min(1f, _happiness + 0.1f);
            }
            _isBusy = true;
            _actionTimer = 1.5f;
        }
        else
        {
            MoveToTarget(player.transform.position);
        }
    }

    protected override void Think()
    {
        base.Think();

        // Merchant specific decisions
        if (_inventory == 0)
        {
            _currentGoal = "restock";
        }
        else if (_gold > 200)
        {
            _currentGoal = "invest";
        }
    }
}

/// <summary>
/// Jules AI Agent - Farmer (resource gathering)
/// </summary>
public class JulesFarmerAgent : JulesAIAgent
{
    private int _crops = 0;

    protected override void InitializeAgent()
    {
        _canGather = true;
        _canMove = true;
        _autonomyLevel = 3;
        _agentName = name + "_Farmer";
        _agentRole = "Farmer";
        _currentGoal = "plant";
    }

    protected override void ExecuteGather()
    {
        Vector3 plot = FindFarmPlot();
        float dist = Vector3.Distance(transform.position, plot);

        if (dist > 0.5f)
        {
            MoveToTarget(plot);
        }
        else
        {
            // Farm action
            if (_currentGoal == "plant")
            {
                _currentGoal = "tend";
                AddMemory("Planted crops");
            }
            else if (_currentGoal == "tend")
            {
                _motivation += 0.05f;
            }
            else if (_currentGoal == "harvest")
            {
                _crops += 5;
                AddMemory($"Harvested {_crops} crops");
            }

            _isBusy = true;
            _actionTimer = 2f;
        }
    }

    protected override void Think()
    {
        base.Think();

        if (_currentGoal == "plant" && Random.value < 0.5f)
        {
            _currentGoal = "harvest";
        }
    }

    Vector3 FindFarmPlot()
    {
        return transform.position + new Vector3(Random.Range(-3f, 3f), 0, Random.Range(-3f, 3f));
    }
}