using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Game bootstrap - creates all game objects automatically
/// </summary>
public class GameBootstrap : MonoBehaviour
{
    void Start()
    {
        Debug.Log("=== AFK Game Starting ===");
        Debug.Log("Controls: WASD - move, Space - interact, Click - attack, E - ability");

        CreateWorld();
        CreatePlayer();
        CreateNPCs();
        CreateEnemies();
        CreateUI();
        CreateSystems();

        Debug.Log("=== Game Ready! ===");
    }

    void CreateWorld()
    {
        // Create world generator
        GameObject worldGO = new GameObject("WorldGenerator");
        worldGO.AddComponent<WorldGenerator>();
        Debug.Log("World created");
    }

    void CreatePlayer()
    {
        // Create player
        GameObject playerGO = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        playerGO.name = "Player";
        playerGO.transform.position = new Vector3(0, 1, 0);
        playerGO.GetComponent<Renderer>().material.color = Color.blue;

        // Add components
        playerGO.AddComponent<PlayerController>();
        playerGO.AddComponent<PlayerSystem>();

        Debug.Log("Player created");
    }

    void CreateNPCs()
    {
        // Create wizard Eldric
        GameObject npc1 = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        npc1.name = "Eldric";
        npc1.transform.position = new Vector3(3, 1, 3);
        npc1.GetComponent<Renderer>().material.color = Color.cyan;

        NPCDialog dialog1 = npc1.AddComponent<NPCDialog>();
        // Set via inspector or code - dialog tree initialized in NPCDialog.Start()
        Debug.Log("NPC Eldric created");

        // Create merchant Brom
        GameObject npc2 = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        npc2.name = "Brom";
        npc2.transform.position = new Vector3(5, 1, -2);
        npc2.GetComponent<Renderer>().material.color = Color.yellow;

        NPCDialog dialog2 = npc2.AddComponent<NPCDialog>();
        Debug.Log("NPC Brom created");
    }

    void CreateEnemies()
    {
        // Create some goblins
        for (int i = 0; i < 3; i++)
        {
            GameObject enemy = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            enemy.name = $"Goblin_{i}";
            enemy.transform.position = new Vector3(Random.Range(-10, 10), 1, Random.Range(-10, 10));
            enemy.GetComponent<Renderer>().material.color = Color.magenta;

            Enemy enemyScript = enemy.AddComponent<Enemy>();
            enemyScript.GetType(); // Reference for compilation

            Debug.Log($"Enemy Goblin_{i} created");
        }
    }

    void CreateUI()
    {
        // Create canvas
        GameObject canvasGO = new GameObject("Canvas");
        Canvas canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGO.AddComponent<CanvasScaler>();
        canvasGO.AddComponent<GraphicRaycaster>();

        // Health bar
        GameObject healthGO = new GameObject("HealthText");
        healthGO.transform.SetParent(canvasGO.transform, false);
        Text healthText = healthGO.AddComponent<Text>();
        healthText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        healthText.fontSize = 24;
        healthText.color = Color.green;
        healthText.text = "Health: 100";

        RectTransform rt = healthGO.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, 1);
        rt.anchorMax = new Vector2(0, 1);
        rt.pivot = new Vector2(0, 1);
        rt.anchoredPosition = new Vector2(10, -10);
        rt.sizeDelta = new Vector2(200, 30);

        // Dialog box
        GameObject dialogGO = new GameObject("DialogText");
        dialogGO.transform.SetParent(canvasGO.transform, false);
        Text dialogText = dialogGO.AddComponent<Text>();
        dialogText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        dialogText.fontSize = 18;
        dialogText.color = Color.white;
        dialogText.text = "";

        RectTransform dlgRT = dialogGO.GetComponent<RectTransform>();
        dlgRT.anchorMin = new Vector2(0, 0);
        dlgRT.anchorMax = new Vector2(1, 0);
        dlgRT.anchoredPosition = new Vector2(0, 50);
        dlgRT.sizeDelta = new Vector2(-20, 100);

        Debug.Log("UI created");
    }

    void CreateSystems()
    {
        // Create story manager
        GameObject storyGO = new GameObject("StoryManager");
        storyGO.AddComponent<StoryManager>();

        // Create quest manager
        GameObject questGO = new GameObject("QuestManager");
        questGO.AddComponent<QuestManager>();

        Debug.Log("Systems created");
    }
}