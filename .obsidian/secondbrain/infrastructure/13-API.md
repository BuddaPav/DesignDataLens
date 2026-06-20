---
tags: [knowledge, network]
type: api-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# API Encyclopedia

## Endpoints

### Player

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /player/:id | Get player |
| PUT | /player/:id | Update player |
| POST | /inventory | Add item |
| DELETE | /inventory/:itemId | Remove item |

### NPC

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /npcs | List NPCs |
| GET | /npcs/:id | Get NPC |
| POST | /npcs/:id/dialogue | Interact |

### World

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /world/state | Get state |
| GET | /world/events | Get events |
| POST | /world/events | Create event |

### Save

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /save | Save game |
| GET | /save/:id | Load save |
| LIST | /saves | List saves |

## Response Format

```ts
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```


## Error Codes

| Code | Description |
|------|-------------|
| E_NOT_FOUND | Resource not found |
| E_UNAUTHORIZED | Auth required |
| E_FORBIDDEN | No permission |
| E_VALIDATION | Invalid data |
| E_SERVER | Internal error |

## Authentication

- JWT tokens
- Refresh every 15 min
- Secure storage in httpOnly cookie
