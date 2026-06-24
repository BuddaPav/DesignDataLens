using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Extended NPC with dialog system and quests
/// </summary>
public class NPCDialog : MonoBehaviour
{
    [Header("NPC Data")]
    [SerializeField] private string _npcName = "Eldric";
    [SerializeField] private string _role = "Wizard";
    [SerializeField] private string _greeting = "Greetings, traveler!";

    [Header("Dialog")]
    [SerializeField] private DialogNode[] _dialogs;

    private int _currentDialogIndex;
    private string _relationship = "neutral"; // neutral, friendly, hostile
    private int _favorPoints;

    public string NPCName => _npcName;
    public string Role => _role;

    void Start()
    {
        InitializeDialogs();
    }

    void InitializeDialogs()
    {
        if (_dialogs == null || _dialogs.Length == 0)
        {
            _dialogs = new DialogNode[]
            {
                new DialogNode
                {
                    id = "intro",
                    text = "Greetings, traveler! I am {_npcName}, the court wizard. The prophecy speaks of your arrival.",
                    options = new DialogOption[]
                    {
                        new DialogOption { text = "What prophecy?", nextId = "prophecy" },
                        new DialogOption { text = "Who are you?", nextId = "identity" },
                        new DialogOption { text = "I need to go.", nextId = "bye" }
                    }
                },
                new DialogNode
                {
                    id = "prophecy",
                    text = "The ancient scrolls speak of a hero who will come from beyond the veil... You bear the mark. I can teach you magic.",
                    options = new DialogOption[]
                    {
                        new DialogOption { text = "Teach me!", nextId = "training" },
                        new DialogOption { text = "Not interested.", nextId = "bye" }
                    }
                },
                new DialogNode
                {
                    id = "identity",
                    text = "I am Eldric, wizard of the Silver Court. I've waited centuries for your arrival.",
                    options = new DialogOption[]
                    {
                        new DialogOption { text = "Tell me more.", nextId = "intro" },
                        new DialogOption { text = "Goodbye.", nextId = "bye" }
                    }
                },
                new DialogNode
                {
                    id = "training",
                    text = "Very well. Press E to use your new abilities! The darkness approaches...",
                    options = new DialogOption[]
                    {
                        new DialogOption { text = "Thank you.", nextId = "bye" }
                    },
                    givesAbility = true
                },
                new DialogNode
                {
                    id = "bye",
                    text = "May the light guide your path, hero.",
                    options = new DialogOption[0]
                }
            };
        }
    }

    public void OnInteract(PlayerController player)
    {
        Debug.Log($"=== Talking to {_npcName} ({_role}) ===");
        Debug.Log(_greeting);

        // Start dialog
        StartDialog();
    }

    void StartDialog()
    {
        _currentDialogIndex = 0;
        ShowCurrentDialog();
    }

    void ShowCurrentDialog()
    {
        if (_currentDialogIndex < _dialogs.Length)
        {
            var dialog = _dialogs[_currentDialogIndex];
            Debug.Log($"{_npcName}: {dialog.text}");

            // Show options (player must press keys)
            if (dialog.options != null && dialog.options.Length > 0)
            {
                Debug.Log("Options:");
                for (int i = 0; i < dialog.options.Length; i++)
                {
                    Debug.Log($"  [{i + 1}] {dialog.options[i].text}");
                }
            }

            // Give ability if specified
            if (dialog.givesAbility)
            {
                Debug.Log("You learned a new ability!");
            }
        }
    }

    public void SelectOption(int optionIndex)
    {
        if (_currentDialogIndex < _dialogs.Length)
        {
            var dialog = _dialogs[_currentDialogIndex];
            if (dialog.options != null && optionIndex < dialog.options.Length)
            {
                string nextId = dialog.options[optionIndex].nextId;
                GoToDialog(nextId);
            }
        }
    }

    void GoToDialog(string id)
    {
        for (int i = 0; i < _dialogs.Length; i++)
        {
            if (_dialogs[i].id == id)
            {
                _currentDialogIndex = i;
                ShowCurrentDialog();
                return;
            }
        }
    }

    public string GetGreeting()
    {
        return _greeting;
    }
}

public class DialogNode
{
    public string id;
    public string text;
    public DialogOption[] options;
    public bool givesAbility;
    public string questToGive;
}

public class DialogOption
{
    public string text;
    public string nextId;
}