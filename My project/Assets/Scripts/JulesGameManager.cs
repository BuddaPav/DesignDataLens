using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Jules Game Manager - Central game controller
/// </summary>
public class JulesGameManager : MonoBehaviour
{
    public static JulesGameManager Instance { get; private set; }

    [Header("Game State")]
    [SerializeField] private string _gameState = "Menu";
    [SerializeField] private int _gameTime = 0;
    [SerializeField] private float _gameSpeed = 1f;

    [Header("World")]
    [SerializeField] private JulesWorldGenerator _world;
    [SerializeField] private JulesPlayerController _player;
    [SerializeField] private JulesUIManager _ui;

    [Header("Entities")]
    [SerializeField] private List<JulesEnemy> _enemies = new List<JulesEnemy>();
    [SerializeField] private List<JulesNPC> _npcs = new List<JulesNPC>();

    [Header("Audio")]
    [SerializeField] private AudioSource _musicSource;
    [SerializeField] private AudioClip[] _musicTracks;

    public string GameState => _gameState;
    public int GameTime => _gameTime;
    public JulesPlayerController Player => _player;
    public JulesUIManager UI => _ui;
    public List<JulesEnemy> Enemies => _enemies;
    public List<JulesNPC> NPCs => _npcs;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        InitializeGame();
    }

    void InitializeGame()
    {
        Debug.Log("=== Jules Game Starting ===");

        // Create world
        CreateWorld();

        // Create player
        CreatePlayer();

        // Create enemies
        CreateEnemies();

        // Create NPCs
        CreateNPCs();

        // Create UI
        CreateUI();

        // Start music
        PlayMusic(0);

        _gameState = "Playing";
        Debug.Log("=== Jules Game Ready! ===");
    }

    void Update()
    {
        if (_gameState != "Playing") return;

        _gameTime += (int)(Time.deltaTime * _gameSpeed * 60);
        UpdateAI();
    }

    void CreateWorld()
    {
        GameObject worldObj = new GameObject("JulesWorld");
        _world = worldObj.AddComponent<JulesWorldGenerator>();
        Debug.Log("World created");
    }

    void CreatePlayer()
    {
        GameObject playerObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        playerObj.name = "Jules";
        playerObj.transform.position = new Vector3(0, 1, 0);
        playerObj.GetComponent<Renderer>().material.color = Color.cyan;
        playerObj.tag = "Player";

        _player = playerObj.AddComponent<JulesPlayerController>();
        Debug.Log("Jules player created");
    }

    void CreateEnemies()
    {
        // Spawn different enemy types
        SpawnEnemy("Goblin", new Vector3(5, 1, 5), "goblin");
        SpawnEnemy("Orc", new Vector3(-8, 1, 3), "orc");
        SpawnEnemy("Dragon", new Vector3(10, 1, -10), "dragon");
    }

    void SpawnEnemy(string name, Vector3 position, string type)
    {
        GameObject enemyObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        enemyObj.name = name;
        enemyObj.transform.position = position;

        Color enemyColor = type switch
        {
            "goblin" => Color.green,
            "orc" => Color.red,
            "dragon" => new Color(0.5f, 0, 0.5f),
            _ => Color.magenta
        };
        enemyObj.GetComponent<Renderer>().material.color = enemyColor;

        JulesEnemy enemy = enemyObj.AddComponent<JulesEnemy>();
        enemy.Initialize(name, type);
        _enemies.Add(enemy);
    }

    void CreateNPCs()
    {
        SpawnNPC("Eldric", "Wizard", new Vector3(3, 1, 3), "Greetings, hero! The darkness approaches...");
        SpawnNPC("Brom", "Merchant", new Vector3(-5, 1, 2), "Want to buy some supplies?");
        SpawnNPC("Marcus", "Guard", new Vector3(0, 1, -8), "Keep the peace!");
    }

    void SpawnNPC(string name, string role, Vector3 position, string greeting)
    {
        GameObject npcObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        npcObj.name = name;
        npcObj.transform.position = position;
        npcObj.GetComponent<Renderer>().material.color = role == "Wizard" ? Color.yellow : Color.white;

        JulesNPC npc = npcObj.AddComponent<JulesNPC>();
        npc.Initialize(name, role, greeting);
        _npcs.Add(npc);
    }

    void CreateUI()
    {
        GameObject uiObj = new GameObject("JulesUI");
        _ui = uiObj.AddComponent<JulesUIManager>();
        Debug.Log("UI created");
    }

    void UpdateAI()
    {
        // Update enemy AI
        foreach (var enemy in _enemies)
        {
            if (enemy != null)
            {
                enemy.UpdateAI();
            }
        }

        // Clean up dead enemies
        _enemies.RemoveAll(e => e == null);
    }

    void PlayMusic(int trackIndex)
    {
        if (_musicSource == null)
        {
            _musicSource = gameObject.AddComponent<AudioSource>();
            _musicSource.loop = true;
            _musicSource.Play();
        }
    }

    public void AddScore(int points)
    {
        _ui?.AddScore(points);
    }

    public void ShowMessage(string message)
    {
        _ui?.ShowMessage(message);
    }

    public void GameOver()
    {
        _gameState = "GameOver";
        _ui?.ShowGameOver();
        Debug.Log("=== Game Over ===");
    }

    public void Victory()
    {
        _gameState = "Victory";
        _ui?.ShowVictory();
        Debug.Log("=== Victory! ===");
    }
}

/// <summary>
/// Jules Player Controller
/// </summary>
public class JulesPlayerController : MonoBehaviour
{
    public static JulesPlayerController Instance { get; private set; }

    [Header("Stats")]
    [SerializeField] private int _health = 100;
    [SerializeField] private int _maxHealth = 100;
    [SerializeField] private int _mana = 50;
    [SerializeField] private int _maxMana = 50;
    [SerializeField] private int _gold = 0;
    [SerializeField] private int _level = 1;
    [SerializeField] private int _xp = 0;

    [Header("Combat")]
    [SerializeField] private int _damage = 10;
    [SerializeField] private float _attackRange = 2f;
    [SerializeField] private float _attackCooldown = 0.5f;
    [SerializeField] private float _moveSpeed = 5f;

    private float _attackTimer;
    private bool _isDead;
    private JulesAbility _currentAbility;

    public int Health => _health;
    public int MaxHealth => _maxHealth;
    public int Mana => _mana;
    public int MaxMana => _maxMana;
    public int Gold => _gold;
    public int Level => _level;
    public int XP => _xp;
    public bool IsDead => _isDead;

    void Awake()
    {
        Instance = this;
    }

    void Update()
    {
        if (_isDead) return;

        HandleInput();
        HandleCombat();
    }

    void HandleInput()
    {
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");

        if (h != 0 || v != 0)
        {
            Vector3 move = new Vector3(h, 0, v).normalized * _moveSpeed * Time.deltaTime;
            transform.position += move;
        }

        if (Input.GetKeyDown(KeyCode.Space))
        {
            TryInteract();
        }

        if (Input.GetMouseButtonDown(0))
        {
            TryAttack();
        }

        if (Input.GetKeyDown(KeyCode.Q))
        {
            UseAbility(0);
        }
        if (Input.GetKeyDown(KeyCode.W))
        {
            UseAbility(1);
        }
        if (Input.GetKeyDown(KeyCode.E))
        {
            UseAbility(2);
        }
    }

    void HandleCombat()
    {
        if (_attackTimer > 0)
        {
            _attackTimer -= Time.deltaTime;
        }
    }

    void TryInteract()
    {
        var npcs = FindObjectsOfComponent<JulesNPC>();
        foreach (var npc in npcs)
        {
            if (Vector3.Distance(transform.position, npc.transform.position) < 2f)
            {
                npc.Interact();
                return;
            }
        }
    }

    void TryAttack()
    {
        if (_attackTimer > 0) return;

        var enemies = FindObjectsOfComponent<JulesEnemy>();
        foreach (var enemy in enemies)
        {
            if (Vector3.Distance(transform.position, enemy.transform.position) < _attackRange)
            {
                Attack(enemy);
                return;
            }
        }
    }

    void Attack(JulesEnemy target)
    {
        _attackTimer = _attackCooldown;
        target?.TakeDamage(_damage);
        CreateAttackEffect(target.transform.position);
    }

    void CreateAttackEffect(Vector3 position)
    {
        GameObject effect = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        effect.transform.position = position;
        effect.transform.localScale = Vector3.one * 0.3f;
        Destroy(effect, 0.2f);
    }

    public void UseAbility(int index)
    {
        if (_mana < 10) return;

        _mana -= 10;
        _attackTimer = _attackCooldown;

        // Area attack
        var enemies = FindObjectsOfComponent<JulesEnemy>();
        foreach (var enemy in enemies)
        {
            if (Vector3.Distance(transform.position, enemy.transform.position) < 5f)
            {
                enemy.TakeDamage(_damage * 2);
            }
        }

        CreateAbilityEffect();
    }

    void CreateAbilityEffect()
    {
        GameObject effect = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        effect.transform.position = transform.position;
        effect.transform.localScale = Vector3.one * 5f;
        var renderer = effect.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = new Color(0, 1, 1, 0.3f);
        }
        Destroy(effect, 0.5f);
    }

    public void TakeDamage(int damage)
    {
        if (_isDead) return;

        _health -= damage;
        if (_health <= 0)
        {
            _health = 0;
            Die();
        }
    }

    public void Heal(int amount)
    {
        _health = Mathf.Min(_maxHealth, _health + amount);
    }

    public void RestoreMana(int amount)
    {
        _mana = Mathf.Min(_maxMana, _mana + amount);
    }

    public void AddGold(int amount)
    {
        _gold += amount;
        JulesGameManager.Instance?.AddScore(amount);
    }

    public void AddXP(int amount)
    {
        _xp += amount;
        while (_xp >= _level * 100)
        {
            _xp -= _level * 100;
            LevelUp();
        }
    }

    void LevelUp()
    {
        _level++;
        _maxHealth += 20;
        _health = _maxHealth;
        _maxMana += 10;
        _mana = _maxMana;
        _damage += 5;

        JulesGameManager.Instance?.ShowMessage($"Level Up! Now level {_level}");
    }

    void Die()
    {
        _isDead = true;
        JulesGameManager.Instance?.GameOver();
    }

    public void PickUpItem(JulesItem item)
    {
        if (item.Type == "gold")
        {
            AddGold(item.Value);
        }
        else if (item.Type == "potion")
        {
            Heal(50);
        }
        else if (item.Type == "mana")
        {
            RestoreMana(25);
        }
    }
}

/// <summary>
/// Jules Enemy
/// </summary>
public class JulesEnemy : MonoBehaviour
{
    [Header("Stats")]
    [SerializeField] private string _enemyName;
    [SerializeField] private string _enemyType;
    [SerializeField] private int _health = 50;
    [SerializeField] private int _maxHealth = 50;
    [SerializeField] private int _damage = 10;
    [SerializeField] private int _goldReward = 10;
    [SerializeField] private int _xpReward = 25;

    private float _attackTimer;
    private float _moveSpeed = 2f;
    private bool _isDead;

    public string EnemyName => _enemyName;
    public string EnemyType => _enemyType;

    public void Initialize(string name, string type)
    {
        _enemyName = name;
        _enemyType = type;

        // Adjust stats by type
        (int health, int damage, int gold, int xp) = type switch
        {
            "goblin" => (30, 5, 5, 15),
            "orc" => (60, 10, 15, 30),
            "dragon" => (200, 25, 100, 200),
            _ => (50, 10, 10, 25)
        };

        _maxHealth = health;
        _health = health;
        _damage = damage;
        _goldReward = gold;
        _xpReward = xp;
    }

    public void UpdateAI()
    {
        if (_isDead) return;

        var player = JulesPlayerController.Instance;
        if (player == null || player.IsDead) return;

        float dist = Vector3.Distance(transform.position, player.transform.position);

        if (dist < 2f)
        {
            AttackPlayer();
        }
        else if (dist < 8f)
        {
            ChasePlayer();
        }
    }

    void ChasePlayer()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        Vector3 dir = (player.transform.position - transform.position).normalized;
        transform.position += dir * _moveSpeed * Time.deltaTime;
    }

    void AttackPlayer()
    {
        _attackTimer -= Time.deltaTime;
        if (_attackTimer <= 0)
        {
            _attackTimer = 1f;
            var player = JulesPlayerController.Instance;
            player?.TakeDamage(_damage);
        }
    }

    public void TakeDamage(int damage)
    {
        if (_isDead) return;

        _health -= damage;
        if (_health <= 0)
        {
            Die();
        }
        else
        {
            FlashDamage();
        }
    }

    void FlashDamage()
    {
        var renderer = GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = Color.red;
            Invoke(nameof(ResetColor), 0.15f);
        }
    }

    void ResetColor()
    {
        var renderer = GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = _enemyType switch
            {
                "goblin" => Color.green,
                "orc" => Color.red,
                "dragon" => new Color(0.5f, 0, 0.5f),
                _ => Color.magenta
            };
        }
    }

    void Die()
    {
        _isDead = true;
        var player = JulesPlayerController.Instance;
        player?.AddGold(_goldReward);
        player?.AddXP(_xpReward);

        transform.localScale *= 0.5f;
        Destroy(gameObject, 2f);

        // Check for dragon kill - victory
        if (_enemyType == "dragon")
        {
            JulesGameManager.Instance?.Victory();
        }
    }
}

/// <summary>
/// Jules NPC
/// </summary>
public class JulesNPC : MonoBehaviour
{
    [Header("Data")]
    [SerializeField] private string _npcName;
    [SerializeField] private string _role;
    [SerializeField] private string _greeting;
    [SerializeField] private string[] _dialog;

    private int _dialogIndex;

    public string NPCName => _npcName;
    public string Role => _role;
    public string Greeting => _greeting;

    public void Initialize(string name, string role, string greeting)
    {
        _npcName = name;
        _role = role;
        _greeting = greeting;

        _dialog = role switch
        {
            "Wizard" => new[]
            {
                "The ancient prophecy speaks of a hero who will come.",
                "You must defeat the dragon to save our land!",
                "Train harder! Visit the forest to the east.",
                "May magic guide your path, hero!"
            },
            "Merchant" => new[]
            {
                "Welcome! What can I get you?",
                "I have the finest weapons in the realm.",
                "Come back when you have more gold!",
                "Safe travels!"
            },
            "Guard" => new[]
            {
                "The kingdom is at peace... for now.",
                "Keep your weapons ready!",
                "Report any disturbances to me.",
                "Stay safe out there!"
            },
            _ => new[] { greeting }
        };
    }

    public void Interact()
    {
        _dialogIndex = 0;
        ShowDialog();
    }

    void ShowDialog()
    {
        if (_dialog != null && _dialogIndex < _dialog.Length)
        {
            JulesGameManager.Instance?.ShowMessage($"{_npcName}: {_dialog[_dialogIndex]}");
        }
    }

    public void NextDialog()
    {
        _dialogIndex++;
        ShowDialog();
    }
}

/// <summary>
/// Jules Item
/// </summary>
[System.Serializable]
public class JulesItem
{
    public string Name;
    public string Type;
    public int Value;

    public JulesItem(string name, string type, int value)
    {
        Name = name;
        Type = type;
        Value = value;
    }
}

/// <summary>
/// Jules Ability
/// </summary>
[System.Serializable]
public class JulesAbility
{
    public string Name;
    public int ManaCost;
    public int Damage;
    public float Cooldown;
    public string Description;

    public JulesAbility(string name, int manaCost, int damage, float cooldown, string description)
    {
        Name = name;
        ManaCost = manaCost;
        Damage = damage;
        Cooldown = cooldown;
        Description = description;
    }
}