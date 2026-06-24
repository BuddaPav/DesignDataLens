using UnityEngine;

/// <summary>
/// Enemy - monsters that can be attacked
/// </summary>
public class Enemy : MonoBehaviour
{
    [Header("Stats")]
    [SerializeField] private string _enemyName = "Goblin";
    [SerializeField] private int _health = 50;
    [SerializeField] private int _maxHealth = 50;
    [SerializeField] private int _damage = 10;
    [SerializeField] private float _attackRange = 1f;
    [SerializeField] private float _attackCooldown = 2f;
    [SerializeField] private int _xpReward = 25;
    [SerializeField] private int _goldReward = 10;

    private float _attackTimer;
    private float _deathTimer = 5f; // Despawn after 5 seconds
    private PlayerSystem _cachedPlayer;
    private Transform _playerTransform;

    public string EnemyName => _enemyName;
    public int Health => _health;
    public bool IsDead => _health <= 0;

    void Start()
    {
        // Cache player reference once
        _cachedPlayer = FindObjectOfType<PlayerSystem>();
        if (_cachedPlayer != null)
        {
            _playerTransform = _cachedPlayer.transform;
        }
    }

    void Update()
    {
        if (IsDead)
        {
            _deathTimer -= Time.deltaTime;
            if (_deathTimer <= 0)
            {
                Destroy(gameObject);
            }
            return;
        }

        UpdateAI();
    }

    void UpdateAI()
    {
        // Simple AI - move toward player if close
        if (_playerTransform != null)
        {
            float dist = Vector3.Distance(transform.position, _playerTransform.position);

            if (dist <= 5f && dist > _attackRange)
            {
                // Move toward player
                Vector3 dir = (_playerTransform.position - transform.position).normalized;
                transform.position += dir * 2f * Time.deltaTime;
            }
            else if (dist <= _attackRange)
            {
                // Attack player
                _attackTimer -= Time.deltaTime;
                if (_attackTimer <= 0)
                {
                    AttackPlayer();
                }
            }
        }
    }

    void AttackPlayer()
    {
        _attackTimer = _attackCooldown;

        // Deal damage to player
        if (_cachedPlayer != null)
        {
            _cachedPlayer.TakeDamage(_damage);
            Debug.Log($"{_enemyName} attacks for {_damage} damage!");
        }
    }

    public void TakeDamage(int damage)
    {
        _health -= damage;

        // Visual feedback
        GetComponent<Renderer>().material.color = Color.red;

        Invoke("ResetColor", 0.2f);

        if (IsDead)
        {
            OnDeath();
        }
    }

    void ResetColor()
    {
        if (!IsDead && GetComponent<Renderer>() != null)
        {
            GetComponent<Renderer>().material.color = Color.magenta;
        }
    }

    void OnDeath()
    {
        Debug.Log($"{_enemyName} defeated!");

        // Give rewards
        if (_cachedPlayer != null)
        {
            _cachedPlayer.AddGold(_goldReward);
            _cachedPlayer.AddExperience(_xpReward);
            Debug.Log($"Reward: {_goldReward} gold, {_xpReward} XP");
        }

        // Scale down for death effect
        transform.localScale *= 0.5f;
    }

    public void AddProgressToQuest(string targetEnemy, int amount)
    {
        // Called when killed - can be hooked into QuestManager
        QuestManager qm = FindObjectOfType<QuestManager>();
        if (qm != null)
        {
            Quest quest = qm.GetActiveQuest(targetEnemy);
            if (quest != null)
            {
                quest.AddProgress(amount);
            }
        }
    }
}