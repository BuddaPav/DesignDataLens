using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Story manager - main narrative flow and quest giver
/// </summary>
public class StoryManager : MonoBehaviour
{
    public static StoryManager Instance { get; private set; }

    [Header("Story Settings")]
    [SerializeField] private string _playerName = "Traveler";

    private List<StoryBeat> _storyBeats = new List<StoryBeat>();
    private int _currentBeatIndex;

    public string CurrentChapter { get; private set; } = "Prologue";
    public int StoryProgress => _currentBeatIndex;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        InitializeStory();
        StartStory();
    }

    void InitializeStory()
    {
        // Prologue - meet the wizard
        _storyBeats.Add(new StoryBeat
        {
            id = "prologue",
            title = "The Awakening",
            description = "You wake up in a strange land. A wizard approaches...",
            type = BeatType.Dialog,
            speakerName = "Eldric",
            speakerText = "Ah, you're finally awake! I've been waiting for you, {_playerName}. The prophecy speaks of a hero who would come to save our land.",
            requiredState = "awake"
        });

        // First challenge
        _storyBeats.Add(new StoryBeat
        {
            id = "first_test",
            title = "The First Test",
            description = "Eldric asks you to defeat a goblin to prove your worth.",
            type = BeatType.Quest,
            speakerName = "Eldric",
            speakerText = "Before I can teach you magic, you must prove your courage. Defeat the goblin in the forest to the east!",
            requiredState = "test_ready",
            questId = "quest_first_test"
        });

        // Training complete
        _storyBeats.Add(new StoryBeat
        {
            id = "training",
            title = "Magic Lessons",
            description = "Learn the basics of magic from Eldric.",
            type = BeatType.Training,
            speakerName = "Eldric",
            speakerText = "Excellent! You have potential. Let me teach you the ways of magic...",
            requiredState = "training_start"
        });

        // The real quest begins
        _storyBeats.Add(new StoryBeat
        {
            id = "real_quest",
            title = "The Dark Threat",
            description = "The real adventure begins as darkness approaches.",
            type = BeatType.Plot,
            speakerName = "Eldric",
            speakerText = "I sense a great darkness rising in the north. The ancient evil awakens... Only you can stop it now.",
            requiredState = "darkness_coming"
        });
    }

    void StartStory()
    {
        if (_storyBeats.Count > 0)
        {
            Debug.Log($"=== {CurrentChapter}: {_storyBeats[0].title} ===");
            Debug.Log(_storyBeats[0].description);
        }
        else
        {
            Debug.LogWarning("No story beats defined!");
        }
    }

    public void AdvanceStory()
    {
        if (_storyBeats.Count == 0)
        {
            Debug.LogWarning("No story beats defined!");
            return;
        }

        if (_currentBeatIndex < _storyBeats.Count - 1)
        {
            _currentBeatIndex++;
            var beat = _storyBeats[_currentBeatIndex];
            Debug.Log($"=== {beat.title} ===");
            Debug.Log(beat.description);

            // Update current chapter
            CurrentChapter = beat.type.ToString();
        }
    }

    public StoryBeat GetCurrentBeat()
    {
        if (_currentBeatIndex < _storyBeats.Count)
        {
            return _storyBeats[_currentBeatIndex];
        }
        return null;
    }

    public void SetStoryState(string state)
    {
        Debug.Log($"Story state: {state}");
    }

    public bool HasMoreStory()
    {
        return _currentBeatIndex < _storyBeats.Count - 1;
    }
}

public class StoryBeat
{
    public string id;
    public string title;
    public string description;
    public BeatType type;
    public string speakerName;
    public string speakerText;
    public string requiredState;
    public string questId;
}

public enum BeatType
{
    Prologue,
    Dialog,
    Quest,
    Training,
    Combat,
    Plot,
    Climax,
    Ending
}