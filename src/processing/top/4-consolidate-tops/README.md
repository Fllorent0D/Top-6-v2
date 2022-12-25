# ConsolidateTopService
La classe `ConsolidateTopService` représente un service qui crée des classements de joueurs (ou "tops") en fonction de différents critères. Il utilise plusieurs autres services, tels que `PlayersPointsProcessingService`, `LevelAttributionService` et `SumPointsService`, pour obtenir les données nécessaires à la création de ces classements.

La méthode `process` est utilisée pour créer les classements. Elle commence par initialiser un objet vide qui servira à stocker les résultats, `this._model`. Ensuite, elle itère sur chaque région de `TOP_REGIONS`, qui est une constante définissant les régions disponibles. Pour chaque région, elle initialise un objet vide qui servira à stocker les classements de la région. Elle utilise également le service `ConfigurationService` pour obtenir la liste des clubs de la région, et filtre la liste des joueurs du `PlayersPointsProcessingService` pour ne conserver que ceux appartenant à l'une de ces clubs.

Pour chaque niveau de la constante `topLevelOrder`, qui définit l'ordre des niveaux de jeu, elle crée un classement de joueurs (un "top") en effectuant les étapes suivantes :

1. Créer une liste vide top qui servira à stocker les joueurs du classement.
2. Filtrer la liste des joueurs de la région pour ne conserver que ceux qui ont été attribués au niveau courant dans le modèle du `LevelAttributionService`.
3. Pour chaque joueur de la liste filtrée, utiliser le service `SumPointsService` pour obtenir les points du joueur, et ajouter un objet contenant les informations du joueur et ses points à la liste top.
4. Trier la liste top en utilisant une fonction de comparaison qui prend en compte le total de points, le nombre de points de chaque valeur (5, 3, 2, 1 ou 0) et le nom du joueur.
5. Enregistrer la liste triée dans `this._model` sous la forme d'un tableau de joueurs pour le niveau et la région courants.

Il y a également une méthode de lecture pour l'objet model : `get model()` renvoie l'objet complet contenant tous les classements.

Enfin, la méthode `getTopForRegionAndLevel(region: TOP_REGIONS, level: TOP_LEVEL, numberOfPlayer = 12)` permet de récupérer un classement pour une région et un niveau donnés. Elle prend en paramètres la région et le niveau souhaités, ainsi qu'un nombre optionnel de joueurs à inclure.


