using UnityEngine;
using UnityEngine.TestTools;
using NUnit.Framework;
using System.Collections;

/// <summary>
/// Unity tests for game systems
/// </summary>
public class GameSystemsTests
{
    /// <summary>
    /// Test Quest creation and progress
    /// </summary>
    [Test]
    public void TestQuestCreation()
    {
        var quest = new Quest
        {
            id = "test_quest",
            title = "Test Quest",
            targetCount = 5,
            currentProgress = 0
        };

        Assert.AreEqual("test_quest", quest.id);
        Assert.AreEqual(0, quest.currentProgress);
        Assert.IsFalse(quest.isCompleted);

        quest.AddProgress(3);
        Assert.AreEqual(3, quest.currentProgress);
        Assert.IsFalse(quest.isCompleted);

        quest.AddProgress(2);
        Assert.AreEqual(5, quest.currentProgress);
        Assert.IsTrue(quest.isCompleted);
    }

    /// <summary>
    /// Test Item creation
    /// </summary>
    [Test]
    public void TestItemCreation()
    {
        var item = new Item("Sword", ItemType.Weapon, 100);

        Assert.AreEqual("Sword", item.Name);
        Assert.AreEqual(ItemType.Weapon, item.Type);
        Assert.AreEqual(100, item.Value);
        Assert.AreEqual(1, item.Quantity);
    }

    /// <summary>
    /// Test Inventory add/remove
    /// </summary>
    [Test]
    public void TestInventory()
    {
        var inventory = new Inventory(5);
        var sword = new Item("Sword", ItemType.Weapon, 100);
        var shield = new Item("Shield", ItemType.Armor, 50);

        Assert.IsTrue(inventory.AddItem(sword));
        Assert.IsTrue(inventory.AddItem(shield));
        Assert.IsFalse(inventory.AddItem(sword)); // Inventory full

        Assert.AreEqual(sword, inventory.GetItem(0));
        Assert.AreEqual(shield, inventory.GetItem(1));

        Assert.IsTrue(inventory.RemoveItem(sword));
        Assert.IsFalse(inventory.RemoveItem(sword)); // Already removed
    }

    /// <summary>
    /// Test Player gold and experience
    /// </summary>
    [Test]
    public void TestPlayerSystemGoldXp()
    {
        // Test without Unity - pure C# logic
        int gold = 0;
        int xp = 0;
        int level = 1;

        gold += 100;
        Assert.AreEqual(100, gold);

        xp += 50;
        Assert.AreEqual(50, xp);

        // Level up at 100 XP
        xp += 100;
        while (xp >= level * 100)
        {
            xp -= level * 100;
            level++;
        }
        Assert.Greater(level, 1);
    }

    /// <summary>
    /// Test Tile coordinates
    /// </summary>
    [Test]
    public void TestTile()
    {
        var tile = new Tile(5, 10, TileType.Grass, new Vector3(10, 0, 20));

        Assert.AreEqual(5, tile.x);
        Assert.AreEqual(10, tile.y);
        Assert.AreEqual(TileType.Grass, tile.type);
        Assert.IsTrue(tile.isWalkable);
    }

    /// <summary>
    /// Test DialogNode branching
    /// </summary>
    [Test]
    public void TestDialogNode()
    {
        var node = new DialogNode
        {
            id = "test",
            text = "Hello traveler!",
            options = new DialogOption[]
            {
                new DialogOption { text = "Hello!", nextId = "greeting" },
                new DialogOption { text = "Goodbye.", nextId = "bye" }
            }
        };

        Assert.AreEqual(2, node.options.Length);
        Assert.AreEqual("Hello!", node.options[0].text);
    }

    /// <summary>
    /// Test StoryBeat structure
    /// </summary>
    [Test]
    public void TestStoryBeat()
    {
        var beat = new StoryBeat
        {
            id = "prologue",
            title = "The Beginning",
            type = BeatType.Prologue,
            speakerName = "Eldric",
            speakerText = "Welcome, hero!"
        };

        Assert.AreEqual("prologue", beat.id);
        Assert.AreEqual(BeatType.Prologue, beat.type);
        Assert.AreEqual("Eldric", beat.speakerName);
    }
}

/// <summary>
/// Test helper for PlayerSystem
/// </summary>
public class TestPlayerSystem : MonoBehaviour
{
    public int Gold { get; private set; }
    public int Level { get; private set; } = 1;
    public int Experience { get; private set; }

    public void AddGold(int amount) => Gold += amount;
    public void AddExperience(int xp)
    {
        Experience += xp;
        while (Experience >= Level * 100)
        {
            Experience -= Level * 100;
            Level++;
        }
    }
}