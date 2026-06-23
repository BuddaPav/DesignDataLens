using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Quest manager for AFK Game
/// Handles quests, objectives, and rewards
/// </summary>
public class QuestManager : MonoBehaviour
{
    [Header("Quest Settings")]
    [SerializeField] private int _maxActiveQuests = 5;
    [SerializeField] private Quest[] _availableQuests;

    private List<Quest> _activeQuests = new List<Quest>();
    private List<Quest> _completedQuests = new List<Quest>();

    void Start()
    {
        LoadDefaultQuests();
    }

    void LoadDefaultQuests()
    {
        if (_availableQuests == null || _availableQuests.Length == 0)
        {
            _availableQuests = new Quest[]
            {
                new Quest
                {
                    id = "quest_welcome",
                    title = "Welcome to AFK World",
                    description = "Speak to Eldric the Wizard",
                    type = QuestType.Main,
                    rewardGold = 50,
                    rewardXp = 100
                },
                new Quest
                {
                    id = "quest_gather",
                    title = "Gather Herbs",
                    description = "Collect 5 healing herbs",
                    type = QuestType.Side,
                    targetCount = 5,
                    targetItem = "herb",
                    rewardGold = 25,
                    rewardXp = 50
                },
                new Quest
                {
                    id = "quest_defeat_rats",
                    title = "Clear the Cellar",
                    description = "Defeat 3 giant rats",
                    type = QuestType.Side,
                    targetCount = 3,
                    targetEnemy = "giant_rat",
                    rewardGold = 30,
                    rewardXp = 75
                }
            };
        }
    }

    public void OnTick()
    {
        // Check quest objectives
        foreach (var quest in _activeQuests)
        {
            quest.CheckProgress();
        }
    }

    public Quest AcceptQuest(string questId)
    {
        if (_activeQuests.Count >= _maxActiveQuests)
        {
            Debug.LogWarning("Max active quests reached");
            return null;
        }

        Quest quest = GetQuest(questId);
        if (quest == null)
        {
            Debug.LogError($"Quest not found: {questId}");
            return null;
        }

        _activeQuests.Add(quest);
        Debug.Log($"Quest accepted: {quest.title}");
        return quest;
    }

    public void CompleteQuest(string questId, PlayerSystem player)
    {
        Quest quest = GetActiveQuest(questId);
        if (quest == null)
        {
            Debug.LogError($"Active quest not found: {questId}");
            return null;
        }

        // Give rewards
        player.AddGold(quest.rewardGold);
        player.AddExperience(quest.rewardXp);

        // Move to completed
        _activeQuests.Remove(quest);
        _completedQuests.Add(quest);

        Debug.Log($"Quest completed: {quest.title}");
    }

    public Quest GetQuest(string id)
    {
        foreach (var quest in _availableQuests)
        {
            if (quest.id == id) return quest;
        }
        return null;
    }

    public Quest GetActiveQuest(string id)
    {
        foreach (var quest in _activeQuests)
        {
            if (quest.id == id) return quest;
        }
        return null;
    }

    public Quest[] GetAvailableQuests() => _availableQuests;
    public Quest[] GetActiveQuests() => _activeQuests.ToArray();
    public Quest[] GetCompletedQuests() => _completedQuests.ToArray();
}

/// <summary>
/// Quest class
/// </summary>
[System.Serializable]
public class Quest
{
    public string id;
    public string title;
    public string description;
    public QuestType type;
    public int targetCount = 1;
    public string targetItem;
    public string targetEnemy;

    public int currentProgress;
    public bool isCompleted;

    public int rewardGold;
    public int rewardXp;

    public void CheckProgress()
    {
        if (isCompleted) return;
        if (currentProgress >= targetCount)
        {
            isCompleted = true;
        }
    }

    public void AddProgress(int amount = 1)
    {
        currentProgress += amount;
        CheckProgress();
    }
}

public enum QuestType
{
    Main,
    Side,
    Daily,
    Event
}