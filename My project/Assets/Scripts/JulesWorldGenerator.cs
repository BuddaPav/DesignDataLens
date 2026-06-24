using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Jules World Generator - Creates dynamic world
/// </summary>
public class JulesWorldGenerator : MonoBehaviour
{
    [Header("World Settings")]
    [SerializeField] private int _width = 30;
    [SerializeField] private int _height = 30;
    [SerializeField] private float _tileSize = 2f;

    [Header("Terrain")]
    [SerializeField] private TileType[,] _tiles;
    [SerializeField] private GameObject[,] _objects;
    [SerializeField] private List<GameObject> _worldObjects = new List<GameObject>();

    [Header("Resources")]
    [SerializeField] private List<JulesResource> _resources = new List<JulesResource>();

    public int Width => _width;
    public int Height => _height;

    void Start()
    {
        GenerateWorld();
    }

    void GenerateWorld()
    {
        _tiles = new TileType[_width, _height];
        _objects = new GameObject[_width, _height];

        CreateTerrain();
        PlaceResources();
        CreateBoundaries();

        Debug.Log($"World generated: {_width}x{_height}");
    }

    void CreateTerrain()
    {
        for (int x = 0; x < _width; x++)
        {
            for (int y = 0; y < _height; y++)
            {
                // Perlin noise for terrain
                float noise = Mathf.PerlinNoise(x * 0.1f, y * 0.1f);
                _tiles[x, y] = noise > 0.6f ? TileType.Water : TileType.Grass;

                if (_tiles[x, y] == TileType.Grass)
                {
                    CreateTile(x, y);
                }
            }
        }
    }

    void CreateTile(int x, int y)
    {
        GameObject tile = GameObject.CreatePrimitive(PrimitiveType.Quad);
        tile.name = $"Tile_{x}_{y}";
        tile.transform.position = new Vector3(x * _tileSize, 0, y * _tileSize);
        tile.transform.rotation = Quaternion.Euler(90, 0, 0);

        Renderer renderer = tile.GetComponent<Renderer>();
        if (renderer != null)
        {
            Color tileColor = Color.Lerp(Color.green, new Color(0.3f, 0.8f, 0.3f),
                Mathf.PerlinNoise(x * 0.2f, y * 0.2f));
            renderer.material.color = tileColor;
        }

        _worldObjects.Add(tile);
    }

    void PlaceResources()
    {
        // Trees
        for (int i = 0; i < 20; i++)
        {
            int x = Random.Range(2, _width - 2);
            int y = Random.Range(2, _height - 2);

            if (_tiles[x, y] == TileType.Grass)
            {
                CreateTree(x, y);
            }
        }

        // Rocks
        for (int i = 0; i < 10; i++)
        {
            int x = Random.Range(2, _width - 2);
            int y = Random.Range(2, _height - 2);

            if (_tiles[x, y] == TileType.Grass)
            {
                CreateRock(x, y);
            }
        }

        // Herbs (healing resources)
        for (int i = 0; i < 15; i++)
        {
            int x = Random.Range(2, _width - 2);
            int y = Random.Range(2, _height - 2);

            if (_tiles[x, y] == TileType.Grass)
            {
                _resources.Add(new JulesResource(x, y, "herb", 5));
            }
        }
    }

    void CreateTree(int x, int y)
    {
        GameObject tree = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        tree.name = $"Tree_{x}_{y}";
        tree.transform.position = new Vector3(x * _tileSize, 1.5f, y * _tileSize);
        tree.transform.localScale = new Vector3(0.8f, 1.5f, 0.8f);

        Renderer renderer = tree.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = new Color(0.2f, 0.5f, 0.2f);
        }

        _worldObjects.Add(tree);
    }

    void CreateRock(int x, int y)
    {
        GameObject rock = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        rock.name = $"Rock_{x}_{y}";
        rock.transform.position = new Vector3(x * _tileSize, 0.5f, y * _tileSize);
        rock.transform.localScale = new Vector3(0.8f, 0.6f, 0.8f);

        Renderer renderer = rock.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.material.color = Color.gray;
        }

        _worldObjects.Add(rock);
    }

    void CreateBoundaries()
    {
        // Walls around the world
        for (int x = 0; x < _width; x++)
        {
            CreateWall(x, 0);
            CreateWall(x, _height - 1);
        }
        for (int y = 0; y < _height; y++)
        {
            CreateWall(0, y);
            CreateWall(_width - 1, y);
        }
    }

    void CreateWall(int x, int y)
    {
        GameObject wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
        wall.name = $"Wall_{x}_{y}";
        wall.transform.position = new Vector3(x * _tileSize, 1f, y * _tileSize);
        wall.transform.localScale = new Vector3(_tileSize, 2f, _tileSize);

        Renderer renderer = wall.GetComponent<Renderer>();
        if (renderer != null)
        renderer.material.color = new Color(0.3f, 0.3f, 0.35f);

        _worldObjects.Add(wall);
    }

    public bool IsWalkable(int x, int y)
    {
        if (x < 0 || x >= _width || y < 0 || y >= _height)
            return false;
        return _tiles[x, y] != TileType.Water;
    }

    public Vector3 GetTilePosition(int x, int y)
    {
        return new Vector3(x * _tileSize, 0, y * _tileSize);
    }

    public JulesResource GetResourceAt(int x, int y)
    {
        return _resources.Find(r => r.x == x && r.y == y);
    }

    public bool GatherResource(int x, int y, string resourceType)
    {
        JulesResource resource = _resources.Find(r => r.x == x && r.y == y && r.type == resourceType);
        if (resource != null && resource.amount > 0)
        {
            resource.amount--;
            if (resource.amount <= 0)
            {
                _resources.Remove(resource);
            }
            return true;
        }
        return false;
    }
}

public enum TileType
{
    Grass,
    Water,
    Sand,
    Stone,
    Forest
}

/// <summary>
/// Jules Resource in world
/// </summary>
[System.Serializable]
public class JulesResource
{
    public int x, y;
    public string type;
    public int amount;
    public int value;

    public JulesResource(int x, int y, string type, int amount)
    {
        this.x = x;
        this.y = y;
        this.type = type;
        this.amount = amount;
        this.value = amount * 5;
    }
}