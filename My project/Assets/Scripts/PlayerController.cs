using UnityEngine;

/// <summary>
/// Player controller - movement, combat, actions
/// </summary>
public class PlayerController : MonoBehaviour
{
    public static PlayerController Instance { get; private set; }

    [Header("Movement")]
    [SerializeField] private float _moveSpeed = 5f;
    [SerializeField] private float _interactionRange = 2f;

    [Header("Combat")]
    [SerializeField] private int _baseDamage = 10;
    [SerializeField] private float _attackRange = 1.5f;
    [SerializeField] private float _attackCooldown = 1f;

    private float _attackTimer;
    private Vector3 _targetPosition;
    private bool _isMoving;

    // State
    public int CurrentTileX { get; private set; }
    public int CurrentTileY { get; private set; }
    public string CurrentAction { get; private set; } = "idle";
    public bool IsAttacking => _attackTimer > 0;

    void Awake()
    {
        Instance = this;
        _targetPosition = transform.position;
    }

    void Start()
    {
        // Start in center of world
        if (WorldGenerator.Instance != null)
        {
            int wx = WorldGenerator.Instance.Width / 2;
            int wy = WorldGenerator.Instance.Height / 2;
            Vector3 startPos = WorldGenerator.Instance.GetTilePosition(wx, wy);
            transform.position = startPos + Vector3.up;
            CurrentTileX = wx;
            CurrentTileY = wy;
        }
    }

    void Update()
    {
        HandleInput();
        UpdateMovement();
        UpdateCombat();
    }

    void HandleInput()
    {
        // WASD movement
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");

        if (h != 0 || v != 0)
        {
            int newX = CurrentTileX + (int)h;
            int newY = CurrentTileY + (int)v;

            TryMoveTo(newX, newY);
        }

        // Space to interact
        if (Input.GetKeyDown(KeyCode.Space))
        {
            TryInteract();
        }

        // Click to attack
        if (Input.GetMouseButtonDown(0))
        {
            TryAttack();
        }

        // E to use ability
        if (Input.GetKeyDown(KeyCode.E))
        {
            UseAbility();
        }
    }

    void UpdateMovement()
    {
        if (_isMoving)
        {
            transform.position = Vector3.MoveTowards(transform.position, _targetPosition, _moveSpeed * Time.deltaTime);

            if (Vector3.Distance(transform.position, _targetPosition) < 0.1f)
            {
                transform.position = _targetPosition;
                _isMoving = false;
                CurrentAction = "idle";
            }
        }
    }

    void UpdateCombat()
    {
        if (_attackTimer > 0)
        {
            _attackTimer -= Time.deltaTime;
        }
    }

    void TryMoveTo(int x, int y)
    {
        Tile tile = WorldGenerator.Instance.GetTile(x, y);
        if (tile != null && tile.isWalkable)
        {
            CurrentTileX = x;
            CurrentTileY = y;
            _targetPosition = tile.position + Vector3.up;
            _isMoving = true;
            CurrentAction = "moving";
        }
    }

    void TryInteract()
    {
        // Check for nearby NPCs
        NPC[] npcs = FindObjectsOfType<NPC>();
        foreach (var npc in npcs)
        {
            float dist = Vector3.Distance(transform.position, npc.transform.position);
            if (dist <= _interactionRange)
            {
                npc.OnInteract(this);
                CurrentAction = "talking";
                return;
            }
        }

        // Check for objects
        Tile tile = WorldGenerator.Instance.GetTile(CurrentTileX, CurrentTileY);
        if (tile != null && tile.objectType != null)
        {
            Debug.Log($"Interacted with: {tile.objectType}");
            CurrentAction = "interacting";
        }
    }

    void TryAttack()
    {
        if (_attackTimer > 0) return;

        _attackTimer = _attackCooldown;
        CurrentAction = "attacking";

        // Find enemies in range
        Enemy[] enemies = FindObjectsOfType<Enemy>();
        foreach (var enemy in enemies)
        {
            float dist = Vector3.Distance(transform.position, enemy.transform.position);
            if (dist <= _attackRange)
            {
                enemy.TakeDamage(_baseDamage);
                Debug.Log($"Hit enemy for {_baseDamage} damage!");
            }
        }
    }

    void UseAbility()
    {
        // Special ability based on class/build
        Debug.Log("Using ability!");
        CurrentAction = "ability";
    }

    public void MoveToTile(int x, int y)
    {
        TryMoveTo(x, y);
    }
}