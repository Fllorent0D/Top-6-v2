# TOP 6 calculation process

[![TypeScript version][ts-badge]][typescript-4-6]
[![Node.js version][nodejs-badge]][nodejs]
[![APLv2][license-badge]][license]
[![Build Status - GitHub Actions][gha-badge]][gha-ci]

## Getting Started

This project compute the TOP 6 ranking every week. 

The rankings is made of multiple regions (Huy, Verviers, Liège). Each club is assigned to a region.
This means that one player can only be assigned to one region.

Each region is divided into levels. Levels are composed on a group of divisions in which players are playing into.

Players are assigned to the most played **level**. 
If a player has equivalent participation's into multiple **levels**, the lower level is chosen

If a player is assigned to a given **level**, all points acquired in lower levels are skipped.

The ranking computing is composed of 3 pipelines: 
- Ingestion
- Processing
- Digestion

### Ingestion

Download all:
- clubs information
- matches from all divisions configured
- divisions information

### Processing

#### 1 - Player points

`PlayersPointsProcessingService` is a service that processes player points for each match. It uses raw match data to calculate each player's points, which are stored in a `PlayerPoints` object that contains the player's name, unique player index, club the player belongs to, and an array of points won for each match.

#### 2 - Level attribution

`LevelAttributionService` is a service that assigns a level to each player based on their points. It uses the points calculated by `PlayersPointsProcessingService` and predefined configuration to determine each player's level, which is stored in an object with the player's unique index as the key.

#### 3 - Sum points

`SumPointsService` is a service that counts the total points and number of points of each type (1, 2, 3, or 5 points) for each player. It uses the points calculated by `PlayersPointsProcessingService` and the levels assigned by `LevelAttributionService` to perform its calculations, which are stored in an object with the player's unique index as the key.

#### 4 - Consolidation

`ConsolidateTopService` is a service that aggregates player data and points to create a ranking by region and by level. It uses the points calculated by `SumPointsService`, configuration information on clubs and divisions, and raw club data to create a `ConsolidateTopModel` object that contains the ranking for each region and each level. Each ranking entry contains the player's unique index, the club's unique index, the club's name, the player's name, and the player's points.

### Digestion




### Clone repository

To clone the repository, use the following commands:

```sh
git clone https://github.com/jsynowiec/node-typescript-boilerplate
cd node-typescript-boilerplate
npm install
```
