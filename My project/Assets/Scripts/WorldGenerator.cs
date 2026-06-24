using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// World generator - creates the game world with tiles, terrain, and objects
/// </summary>
public class WorldGenerator : MonoBehaviour
{
    public static WorldGenerator Instance { get; private set; }

    [Header("World Settings")]
    [SerializeField] private int _worldWidth = 20;
    [SerializeField] private int _worldHeight = 20;
    [SerializeField] private GameObject _groundPrefab;
    [SerializeField] private GameObject _wallPrefab;
    [SerializeField] private GameObject _treePrefab;
    [SerializeField] private GameObject _rockPrefab;

    private Tile[,] _tiles;
    private List<GameObject> _worldObjects = new List<GameObject>();

    public int Width => _worldWidth;
    public int Height => _worldHeight;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        GenerateWorld();
    }

    public void GenerateWorld()
    {
        _tiles = new Tile[_worldWidth, _worldHeight];

        for (int x = 0; x < _worldWidth; x++)
        {
            for (int y = 0; y < _worldHeight; y++)
            {
                CreateTile(x, y);
            }
        }

        // Place decorations
        PlaceDecorations();

        // Place player starting point
        PlacePlayerStart();

        Debug.Log($"World generated: {_worldWidth}x{_worldHeight}");
    }

    void CreateTile(int x, int y)
    {
        // Create ground
        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = $"Tile_{x}_{y}";
        ground.transform.position = new Vector3(x * 2, 0, y * 2);
        ground.transform.localScale = new Vector3(0.2f, 1, 0.2f);

        // Set tile type based on position
        TileType type = DetermineTileType(x, y);
        _tiles[x, y] = new Tile(x, y, type, ground.transform.position);

        // Add walls on edges
        if (x == 0 || x == _worldWidth - 1 || y == 0 || y == _worldHeight - 1)
        {
            CreateWall(x, y);
        }

        _worldObjects.Add(ground);
    }

    TileType DetermineTileType(int x, int y)
    {
        // Create varied terrain
        float noise = Mathf.PerlinNoise(x * 0.1f, y * 0.1f);

        if (noise > 0.7f) return TileType.Forest;
        if (noise > 0.5f) return TileType.Grass;
        if (noise > 0.3f) return TileType.Dirt;
        return TileType.Stone;
    }

    void CreateWall(int x, int y)
    {
        GameObject wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
        wall.name = $"Wall_{x}_{y}";
        wall.transform.position = new Vector3(x * 2, 1, y * 2);
        wall.transform.localScale = new Vector3(2, 2, 2);

        Tile tile = GetTile(x, y);
        if (tile != null)
        {
            tile.isWalkable = false;
        }
        _worldObjects.Add(wall);
    }

    void PlaceDecorations()
    {
        // Random trees and rocks
        for (int i = 0; i < 15; i++)
        {
            int x = Random.Range(2, _worldWidth - 2);
            int y = Random.Range(2, _worldHeight - 2);

            Tile tile = GetTile(x, y);
            if (tile != null && tile.isWalkable)
            {
                GameObject tree = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                tree.name = $"Tree_{x}_{y}";
                tree.transform.position = new Vector3(x * 2, 1, y * 2);
                tree.transform.localScale = new Vector3(0.5f, 2, 0.5f);
                tree.GetComponent<Renderer>().material.color = Color.green;

                tile.isWalkable = false;
                tile.objectType = "tree";
                _worldObjects.Add(tree);
            }
        }

        for (int i = 0; i < 8; i++)
        {
            int x = Random.Range(2, _worldWidth - 2);
            int y = Random.Range(2, _worldHeight - 2);

            Tile tile = GetTile(x, y);
            if (tile != null && tile.isWalkable)
            {
                GameObject rock = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                rock.name = $"Rock_{x}_{y}";
                rock.transform.position = new Vector3(x * 2, 0.5f, y * 2);
                rock.transform.localScale = new Vector3(1, 1, 1);
                rock.GetComponent<Renderer>().material.color = Color.gray;

                tile.isWalkable = false;
                tile.objectType = "rock";
                _worldObjects.Add(rock);
            }
        }
    }

    void PlacePlayerStart()
    {
        // Clear starting area
        int sx = _worldWidth / 2;
        int sy = _worldHeight / 2;

        for (int dx = -1; dx <= 1; dx++)
        {
            for (int dy = -1; dy <= 1; dy++)
            {
                int nx = sx + dx;
                int ny = sy + dy;
                Tile tile = GetTile(nx, ny);
                if (tile != null)
                {
                    tile.isWalkable = true;
                    tile.objectType = null;
                }
            }
        }

        Debug.Log($"Player start: {sx},{sy}");
    }

    public Tile GetTile(int x, int y)
    {
        if (x >= 0 && x < _worldWidth && y >= 0 && y < _worldHeight)
        {
            return _tiles[x, y];
        }
        return null;
    }

    public Vector3 GetTilePosition(int x, int y)
    {
        return new Vector3(x * 2, 0, y * 2);
    }
}

public class Tile
{
    public int x, y;
    public TileType type;
    public Vector3 position;
    public bool isWalkable = true;
    public string objectType;
    public string floorMaterial;

    public Tile(int x, int y, TileType type, Vector3 position)
    {
        this.x = x;
        this.y = y;
        this.type = type;
        this.position = position;
    }
}

public enum TileType
{
    Grass,
    Dirt,
    Stone,
    Forest,
    Water,
    Sand
}