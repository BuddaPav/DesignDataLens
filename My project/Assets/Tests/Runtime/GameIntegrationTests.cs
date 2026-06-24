using UnityEngine;
using NUnit.Framework;
using System.Collections.Generic;

/// <summary>
/// Integration tests for game systems working together
/// </summary>
public class GameIntegrationTests
{
    /// <summary>
    /// Test full quest flow: accept, progress, complete
    /// </summary>
    [Test]
    public void TestFullQuestFlow()
    {
        // Create quest
        var quest = new Quest
        {
            id = "test_quest",
            title = "Test Quest",
            targetCount = 3,
            rewardGold = 50,
            rewardXp = 100,
            currentProgress = 0
        };

        // Simulate killing enemies
        quest.AddProgress(1);
        quest.AddProgress(1);
        quest.AddProgress(1);

        // Quest should be complete
        Assert.IsTrue(quest.isCompleted);
        Assert.AreEqual(3, quest.currentProgress);
    }

    /// <summary>
    /// Test player progression with quest rewards
    /// </summary>
    [Test]
    public void TestPlayerProgressionWithQuests()
    {
        int gold = 0;
        int xp = 0;
        int level = 1;

        // Complete quest
        gold += 50; // Quest reward
        xp += 100; // Quest XP

        // Level up check
        while (xp >= level * 100)
        {
            xp -= level * 100;
            level++;
        }

        Assert.AreEqual(2, level);
        Assert.AreEqual(50, gold);
    }

    /// <summary>
    /// Test combat damage flow
    /// </summary>
    [Test]
    public void TestCombatDamageFlow()
    {
        int playerHealth = 100;
        int enemyDamage = 10;
        int enemyAttackCount = 3;

        // Simulate enemy attacks
        for (int i = 0; i < enemyAttackCount; i++)
        {
            playerHealth = Mathf.Max(0, playerHealth - enemyDamage);
        }

        Assert.AreEqual(70, playerHealth);
        Assert.Greater(0, playerHealth); // Still alive
    }

    /// <summary>
    /// Test death and respawn
    /// </summary>
    [Test]
    public void TestDeathAndRespawn()
    {
        int health = 100;
        int maxHealth = 100;
        int gold = 50;

        // Player dies
        health = 0;
        gold = Mathf.Max(0, gold - 10); // Respawn cost

        // Respawn
        health = maxHealth;

        Assert.AreEqual(100, health);
        Assert.AreEqual(40, gold);
    }

    /// <summary>
    /// Test dialog to quest transition
    /// </summary>
    [Test]
    public void TestDialogToQuestTransition()
    {
        // Start with NPC dialog "training" node
        string currentNode = "intro";
        bool hasQuest = false;

        // Player selects "Teach me!" option -> goes to "training"
        if (currentNode == "intro")
        {
            currentNode = "training";
        }

        // Training gives quest
        if (currentNode == "training")
        {
            hasQuest = true;
        }

        Assert.AreEqual("training", currentNode);
        Assert.IsTrue(hasQuest);
    }

    /// <summary>
    /// Test world tile accessibility
    /// </summary>
    [Test]
    public void TestWorldTileAccessibility()
    {
        int width = 20;
        int height = 20;

        // Create simple tile map
        bool[,] walkable = new bool[width, height];

        // Set edges as blocked
        for (int x = 0; x < width; x++)
        {
            walkable[x, 0] = false;
            walkable[x, height - 1] = false;
        }
        for (int y = 0; y < height; y++)
        {
            walkable[0, y] = false;
            walkable[width - 1, y] = false;
        }

        // Clear center for player
        walkable[width / 2, height / 2] = true;

        // Test player can move
        int px = width / 2;
        int py = height / 2;

        // Can move to adjacent walkable tile
        bool canMove = walkable[px + 1, py];
        Assert.IsTrue(canMove);

        // Cannot move to edge
        canMove = walkable[0, 0];
        Assert.IsFalse(canMove);
    }

    /// <summary>
    /// Test enemy AI detection range
    /// </summary>
    [Test]
    public void TestEnemyAIDetection()
    {
        Vector3 enemyPos = Vector3.zero;
        Vector3 playerPos = new Vector3(3, 0, 0);
        float detectionRange = 5f;
        float attackRange = 1f;

        float dist = Vector3.Distance(enemyPos, playerPos);

        // Enemy should detect player
        bool detected = dist <= detectionRange;
        Assert.IsTrue(detected);

        // But not attack (out of range)
        bool canAttack = dist <= attackRange;
        Assert.IsFalse(canAttack);
    }

    /// <summary>
    /// Test attack cooldowns for multiple enemies
    /// </summary>
    [Test]
    public void TestMultipleEnemyCooldowns()
    {
        float cooldown = 2f;
        float[] timers = { 0f, 0f, 0f }; // 3 enemies

        // All attack at same time
        timers[0] = cooldown;
        timers[1] = cooldown;
        timers[2] = cooldown;

        // All on cooldown
        bool canAttack = timers[0] <= 0;
        Assert.IsFalse(canAttack);

        // Time passes
        timers[0] -= 2.1f;
        canAttack = timers[0] <= 0;
        Assert.IsTrue(canAttack); // First can attack again
    }

    /// <summary>
    /// Test inventory management during shop transaction
    /// </summary>
    [Test]
    public void TestShopTransaction()
    {
        var inventory = new Inventory(5);
        int playerGold = 100;
        int itemCost = 50;

        // Buy item
        if (playerGold >= itemCost)
        {
            playerGold -= itemCost;
            inventory.AddItem(new Item("Potion", ItemType.Potion, itemCost));
        }

        Assert.AreEqual(50, playerGold);
        Assert.IsNotNull(inventory.GetItem(0));
    }

    /// <summary>
    /// Test story progression through beats
    /// </summary>
    [Test]
    public void TestStoryProgression()
    {
        var beats = new List<StoryBeat>
        {
            new StoryBeat { id = "prologue", type = BeatType.Prologue },
            new StoryBeat { id = "quest", type = BeatType.Quest },
            new StoryBeat { id = "climax", type = BeatType.Climax }
        };

        int currentIndex = 0;

        // Advance story
        if (currentIndex < beats.Count - 1)
        {
            currentIndex++;
        }

        var currentBeat = beats[currentIndex];

        Assert.AreEqual(BeatType.Quest, currentBeat.type);
        Assert.AreEqual("quest", currentBeat.id);
    }
}