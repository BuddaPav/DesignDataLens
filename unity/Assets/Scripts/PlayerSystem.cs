using UnityEngine;

/// <summary>
/// Player system managing player state, inventory, and resources
/// </summary>
public class PlayerSystem : MonoBehaviour
{
    [Header("Player State")]
    [SerializeField] private string _playerId;
    [SerializeField] private string _playerName = "Hero";
    [SerializeField] private int _gold;
    [SerializeField] private int _level = 1;
    [SerializeField] private int _experience;

    [Header("Stats")]
    [SerializeField] private int _health = 100;
    [SerializeField] private int _maxHealth = 100;
    [SerializeField] private int _stamina = 50;
    [SerializeField] private int _maxStamina = 50;

    [Header("Inventory")]
    [SerializeField] private Inventory _inventory;

    public string PlayerId => _playerId;
    public string PlayerName => _playerName;
    public int Gold => _gold;
    public int Level => _level;
    public int Experience => _experience;
    public int Health => _health;
    public int MaxHealth => _maxHealth;
    public int Stamina => _stamina;
    public int MaxStamina => _maxStamina;

    void Awake()
    {
        _playerId = System.Guid.NewGuid().ToString();
        if (_inventory == null)
        {
            _inventory = new Inventory(20); // 20 slots
        }
    }

    public void AddGold(int amount)
    {
        _gold = Mathf.Max(0, _gold + amount);
    }

    public bool SpendGold(int amount)
    {
        if (_gold >= amount)
        {
            _gold -= amount;
            return true;
        }
        return false;
    }

    public void Heal(int amount)
    {
        _health = Mathf.Min(_maxHealth, _health + amount);
    }

    public void TakeDamage(int damage)
    {
        _health = Mathf.Max(0, _health - damage);
        if (_health <= 0)
        {
            OnDeath();
        }
    }

    public void AddExperience(int xp)
    {
        _experience += xp;
        CheckLevelUp();
    }

    void CheckLevelUp()
    {
        int xpRequired = _level * 100;
        while (_experience >= xpRequired)
        {
            _experience -= xpRequired;
            _level++;
            _maxHealth += 10;
            _health = _maxHealth;
            xpRequired = _level * 100;
        }
    }

    public bool AddItem(Item item)
    {
        return _inventory.AddItem(item);
    }

    public bool RemoveItem(Item item)
    {
        return _inventory.RemoveItem(item);
    }

    void OnDeath()
    {
        Debug.Log($"{_playerName} has died!");
        // Respawn logic
        _health = _maxHealth;
        _gold = Mathf.Max(0, _gold - 10);
    }
}

/// <summary>
/// Inventory class managing player items
/// </summary>
[System.Serializable]
public class Inventory
{
    [SerializeField] private Item[] _slots;
    [SerializeField] private int _size;

    public Inventory(int size)
    {
        _size = size;
        _slots = new Item[size];
    }

    public bool AddItem(Item item)
    {
        for (int i = 0; i < _slots.Length; i++)
        {
            if (_slots[i] == null)
            {
                _slots[i] = item;
                return true;
            }
        }
        return false;
    }

    public bool RemoveItem(Item item)
    {
        for (int i = 0; i < _slots.Length; i++)
        {
            if (_slots[i] == item)
            {
                _slots[i] = null;
                return true;
            }
        }
        return false;
    }

    public Item GetItem(int index)
    {
        if (index >= 0 && index < _slots.Length)
        {
            return _slots[index];
        }
        return null;
    }
}

/// <summary>
/// Item class for game items
/// </summary>
[System.Serializable]
public class Item
{
    [SerializeField] private string _id;
    [SerializeField] private string _name;
    [SerializeField] private ItemType _type;
    [SerializeField] private int _value;
    [SerializeField] private int _quantity = 1;

    public string Id => _id;
    public string Name => _name;
    public ItemType Type => _type;
    public int Value => _value;
    public int Quantity => _quantity;

    public Item(string name, ItemType type, int value)
    {
        _id = System.Guid.NewGuid().ToString();
        _name = name;
        _type = type;
        _value = value;
    }
}

public enum ItemType
{
    None,
    Weapon,
    Armor,
    Potion,
    Quest,
    Material,
    Currency
}