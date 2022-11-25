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

Computes all the points for all players for all matches.

| 1 victory   | 1 points |
|-------------|----------|
| 2 victories | 2 points |
| 3 victories | 3 points |
| 4 victories | 5 points |

If a opposite player are forfeited, a points is given to the present player.
Example: 


#### 2 - Level attribution

#### 3 - Sum points

#### 4 - Consolidation


### Digestion




### Clone repository

To clone the repository, use the following commands:

```sh
git clone https://github.com/jsynowiec/node-typescript-boilerplate
cd node-typescript-boilerplate
npm install
```
