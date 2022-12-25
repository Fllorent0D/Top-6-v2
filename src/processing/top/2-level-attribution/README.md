# LevelAttributionService
Ce service utilise les données sur les points des joueurs stockées dans le modèle `PlayersPointsProcessingModel` d'un autre service.

Le process méthode est le point d'entrée principal du service. Elle initialise l'objet `PlayersLevelAttribution` qui sera utilisé pour stocker les niveaux attribués aux joueurs, puis parcourt les entrées du modèle `PlayersPointsProcessingModel`. 

Pour chaque joueur, elle utilise la fonction groupBy de la bibliothèque Lodash pour regrouper les points du joueur par niveau, puis trie ces groupes en fonction du nombre de points et de l'ordre de priorité des niveaux. Le niveau qui a le plus de points et qui a la priorité la plus élevée est déterminé comme étant le niveau principal du joueur. Ce niveau est enregistré dans l'objet `PlayersLevelAttribution` pour le joueur en question.

La model méthode retourne l'objet `PlayersLevelAttribution` qui contient les niveaux attribués aux joueurs.