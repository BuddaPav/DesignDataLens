using UnityEngine;
using UnityEngine.UI;
using System.Collections;

/// <summary>
/// Jules UI Manager - Complete game UI
/// </summary>
public class JulesUIManager : MonoBehaviour
{
    [Header("Canvas")]
    [SerializeField] private Canvas _canvas;
    [SerializeField] private GameObject _mainPanel;
    [SerializeField] private GameObject _dialogPanel;
    [SerializeField] private GameObject _inventoryPanel;
    [SerializeField] private GameObject _questPanel;

    [Header("HUD Elements")]
    [SerializeField] private Text _healthText;
    [SerializeField] private Text _manaText;
    [SerializeField] private Text _goldText;
    [SerializeField] private Text _levelText;
    [SerializeField] private Text _xpText;
    [SerializeField] private Text _messageText;

    [Header("Combat")]
    [SerializeField] private GameObject _damageIndicator;
    [SerializeField] private Image _healthBar;
    [SerializeField] private Image _manaBar;
    [SerializeField] private Image _xpBar;

    [Header("Dialog")]
    [SerializeField] private Text _npcNameText;
    [SerializeField] private Text _dialogText;
    [SerializeField] private Button[] _optionButtons;

    private float _messageTimer;
    private bool _showingDialog;

    void Start()
    {
        CreateCanvas();
        CreateHUD();
        CreatePanels();
    }

    void Update()
    {
        UpdateHUD();

        // Message timer
        if (_messageTimer > 0)
        {
            _messageTimer -= Time.deltaTime;
            if (_messageTimer <= 0)
            {
                HideMessage();
            }
        }
    }

    void CreateCanvas()
    {
        GameObject canvasGO = new GameObject("JulesCanvas");
        _canvas = canvasGO.AddComponent<Canvas>();
        _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGO.AddComponent<CanvasScaler>();
        canvasGO.AddComponent<GraphicRaycaster>();
    }

    void CreateHUD()
    {
        // Main HUD panel
        _mainPanel = new GameObject("HUD");
        _mainPanel.transform.SetParent(_canvas.transform, false);

        // Health bar
        _healthBar = CreateBar("HealthBar", Color.red, new Vector2(10, -30), new Vector2(200, 20));
        _healthBar.transform.SetParent(_mainPanel.transform, false);

        _healthText = CreateText("HealthText", "Health: 100", new Vector2(10, -55));
        _healthText.transform.SetParent(_mainPanel.transform, false);

        // Mana bar
        _manaBar = CreateBar("ManaBar", Color.blue, new Vector2(10, -70), new Vector2(200, 15));
        _manaBar.transform.SetParent(_mainPanel.transform, false);

        _manaText = CreateText("ManaText", "Mana: 50", new Vector2(10, -90));
        _manaText.transform.SetParent(_mainPanel.transform, false);

        // XP bar
        _xpBar = CreateBar("XPBar", Color.yellow, new Vector2(10, -105), new Vector2(200, 10));
        _xpBar.transform.SetParent(_mainPanel.transform, false);

        // Gold display
        _goldText = CreateText("GoldText", "Gold: 0", new Vector2(10, -120));
        _goldText.transform.SetParent(_mainPanel.transform, false);

        // Level display
        _levelText = CreateText("LevelText", "Level: 1", new Vector2(10, -140));
        _levelText.transform.SetParent(_mainPanel.transform, false);

        // Message area
        _messageText = CreateText("Message", "", new Vector2(Screen.width / 2, -50));
        _messageText.alignment = TextAnchor.MiddleCenter;
        _messageText.fontSize = 24;
    }

    Image CreateBar(string name, Color color, Vector2 position, Vector2 size)
    {
        GameObject barGO = new GameObject(name);
        barGO.transform.SetParent(_canvas.transform, false);

        Image image = barGO.AddComponent<Image>();
        image.color = new Color(color.r, color.g, color.b, 0.3f);

        RectTransform rt = barGO.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, 1);
        rt.anchorMax = new Vector2(0, 1);
        rt.pivot = new Vector2(0, 1);
        rt.anchoredPosition = position;
        rt.sizeDelta = size;

        // Fill image
        GameObject fillGO = new GameObject("Fill");
        fillGO.transform.SetParent(barGO.transform, false);
        Image fill = fillGO.AddComponent<Image>();
        fill.color = color;
        RectTransform fillRT = fillGO.GetComponent<RectTransform>();
        fillRT.anchorMin = Vector2.zero;
        fillRT.anchorMax = Vector2.one;
        fillRT.offsetMin = Vector2.zero;
        fillRT.offsetMax = Vector2.zero;

        return image;
    }

    Text CreateText(string name, string content, Vector2 position)
    {
        GameObject textGO = new GameObject(name);
        textGO.transform.SetParent(_canvas.transform, false);

        Text text = textGO.AddComponent<Text>();
        text.text = content;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.fontSize = 16;
        text.color = Color.white;
        text.supportRichText = true;

        RectTransform rt = textGO.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, 1);
        rt.anchorMax = new Vector2(0, 1);
        rt.pivot = new Vector2(0, 1);
        rt.anchoredPosition = position;
        rt.sizeDelta = new Vector2(200, 30);

        return text;
    }

    void CreatePanels()
    {
        // Dialog panel
        _dialogPanel = new GameObject("DialogPanel");
        _dialogPanel.transform.SetParent(_canvas.transform, false);
        _dialogPanel.SetActive(false);

        GameObject dialogBG = new GameObject("DialogBG");
        dialogBG.transform.SetParent(_dialogPanel.transform, false);
        Image bg = dialogBG.AddComponent<Image>();
        bg.color = new Color(0, 0, 0, 0.8f);
        RectTransform bgRT = dialogBG.GetComponent<RectTransform>();
        bgRT.anchorMin = new Vector2(0.1f, 0.3f);
        bgRT.anchorMax = new Vector2(0.9f, 0.5f);
        bgRT.offsetMin = Vector2.zero;
        bgRT.offsetMax = Vector2.zero;

        _dialogText = CreateText("DialogContent", "", Vector2.zero);
        _dialogText.transform.SetParent(_dialogPanel.transform, false);
        RectTransform dtRT = _dialogText.GetComponent<RectTransform>();
        dtRT.anchorMin = new Vector2(0.1f, 0.3f);
        dtRT.anchorMax = new Vector2(0.9f, 0.5f);
        dtRT.offsetMin = new Vector2(20, -30);
        dtRT.offsetMax = new Vector2(-20, 30);

        // Inventory panel
        _inventoryPanel = new GameObject("InventoryPanel");
        _inventoryPanel.transform.SetParent(_canvas.transform, false);
        _inventoryPanel.SetActive(false);

        // Quest panel
        _questPanel = new GameObject("QuestPanel");
        _questPanel.transform.SetParent(_canvas.transform, false);
        _questPanel.SetActive(false);
    }

    void UpdateHUD()
    {
        var player = JulesPlayerController.Instance;
        if (player == null) return;

        // Update bars
        float healthPercent = (float)player.Health / player.MaxHealth;
        float manaPercent = (float)player.Mana / player.MaxMana;

        // Update text
        _healthText.text = $"Health: {player.Health}/{player.MaxHealth}";
        _manaText.text = $"Mana: {player.Mana}/{player.MaxMana}";
        _goldText.text = $"Gold: {player.Gold}";
        _levelText.text = $"Level: {player.Level}";
    }

    public void ShowMessage(string message)
    {
        _messageText.text = message;
        _messageTimer = 3f;
    }

    void HideMessage()
    {
        _messageText.text = "";
    }

    public void ShowDialog(string npcName, string dialog)
    {
        _dialogPanel.SetActive(true);
        _npcNameText.text = npcName;
        _dialogText.text = dialog;
        _showingDialog = true;
    }

    public void HideDialog()
    {
        _dialogPanel.SetActive(false);
        _showingDialog = false;
    }

    public void ShowInventory()
    {
        _inventoryPanel.SetActive(true);
    }

    public void HideInventory()
    {
        _inventoryPanel.SetActive(false);
    }

    public void ShowQuests()
    {
        _questPanel.SetActive(true);
    }

    public void HideQuests()
    {
        _questPanel.SetActive(false);
    }

    public void ShowGameOver()
    {
        ShowMessage("GAME OVER - Press R to restart");
    }

    public void ShowVictory()
    {
        ShowMessage("VICTORY! Dragon defeated!");
    }

    public void AddScore(int points)
    {
        // Score could be displayed
    }

    public void ShowDamage(int damage)
    {
        if (_damageIndicator != null)
        {
            _damageIndicator.SetActive(true);
            Invoke(nameof(HideDamage), 0.5f);
        }
    }

    void HideDamage()
    {
        if (_damageIndicator != null)
            _damageIndicator.SetActive(false);
    }
}