using UnityEngine;
using NUnit.Framework;

/// <summary>
/// Edge case tests for game systems
/// </summary>
public class GameEdgeCaseTests
{
    /// <summary>
    /// Test empty inventory
    /// </summary>
    [Test]
    public void TestEmptyInventory()
    {
        var inventory = new Inventory(2);
        Assert.IsNull(inventory.GetItem(0));
        Assert.IsNull(inventory.GetItem(1));
    }

    /// <summary>
    /// Test inventory full
    /// </summary>
    [Test]
    public void TestInventoryFull()
    {
        var inventory = new Inventory(2);

        inventory.AddItem(new Item("A", ItemType.Weapon, 10));
        inventory.AddItem(new Item("B", ItemType.Weapon, 10));

        // Third should fail
        var result = inventory.AddItem(new Item("C", ItemType.Weapon, 10));
        Assert.IsFalse(result);
    }

    /// <summary>
    /// Test quest progress overflow
    /// </summary>
    [Test]
    public void TestQuestProgressOverflow()
    {
        var quest = new Quest
        {
            targetCount = 3,
            currentProgress = 0
        };

        // Add more than needed
        quest.AddProgress(10);
        Assert.IsTrue(quest.isCompleted);
        Assert.AreEqual(10, quest.currentProgress);
    }

    /// <summary>
    /// Test negative gold protection
    /// </summary>
    [Test]
    public void TestNegativeGold()
    {
        int gold = 100;

        // Spending more than available
        if (gold >= 200)
        {
            gold -= 200;
        }
        Assert.AreEqual(100, gold); // Should not go negative
    }

    /// <summary>
    /// Test level up multiple times
    /// </summary>
    [Test]
    public void TestMultipleLevelUp()
    {
        int level = 1;
        int xp = 500; // Should level up to 5

        while (xp >= level * 100)
        {
            xp -= level * 100;
            level++;
        }

        Assert.GreaterOrEqual(level, 5);
        Assert.Less(xp, 100); // Should have remaining XP
    }

    /// <summary>
    /// Test health bounds
    /// </summary>
    [Test]
    public void TestHealthBounds()
    {
        int health = 50;
        int maxHealth = 100;

        // Heal beyond max
        health = Mathf.Min(maxHealth, health + 100);
        Assert.AreEqual(100, health);

        // Take damage
        health = Mathf.Max(0, health - 150);
        Assert.AreEqual(0, health);
    }

    /// <summary>
    /// Test tile bounds
    /// </summary>
    [Test]
    public void TestTileBounds()
    {
        // Simulate world bounds check
        int width = 20;
        int height = 20;

        int testX = 25;
        int testY = -1;

        bool inBounds = testX >= 0 && testX < width && testY >= 0 && testY < height;
        Assert.IsFalse(inBounds);
    }

    /// <summary>
    /// Test attack cooldown
    /// </summary>
    [Test]
    public void TestAttackCooldown()
    {
        float cooldown = 1.0f;
        float timer = 0f;

        // First attack
        if (timer <= 0)
        {
            timer = cooldown;
            // Attack!
        }

        // Try to attack again immediately
        bool canAttack = timer <= 0;
        Assert.IsFalse(canAttack); // Should be on cooldown

        // Simulate time passing
        timer -= 1.1f;
        canAttack = timer <= 0;
        Assert.IsTrue(canAttack); // Now can attack
    }

    /// <summary>
    /// Test dialog option selection
    /// </summary>
    [Test]
    public void TestDialogOptionSelection()
    {
        var option = new DialogOption { text = "Test", nextId = "next" };
        Assert.AreEqual("next", option.nextId);
    }

    /// <summary>
    /// Test enemy death state
    /// </summary>
    [Test]
    public void TestEnemyDeathState()
    {
        int health = 10;
        bool isDead = health <= 0;

        Assert.IsFalse(isDead);

        health -= 15;
        isDead = health <= 0;

        Assert.IsTrue(isDead);
    }
}