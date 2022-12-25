# PlayersPointsProcessingModel
Ce code concerne un service qui traite les données sur les matchs joués. Le service prend en entrée des données sur les matchs et stocke les résultats dans un objet `PlayersPointsProcessingModel`. Le service a des méthodes pour gérer différents types de matchs : des matchs avec un score, des matchs abandonnés et des matchs où une équipe a un "bye".

La méthode `process` est le point d'entrée principal du service. Elle initialise d'abord l'objet `PlayersPointsProcessingModel`, puis récupère tous les matchs de l'objet modèle du service `WeeklyMatchesSummaryIngestionService` et les parcourt. Pour chaque match, elle vérifie les clubs visité et visiteur pour déterminer quelle équipe (ou les deux) traiter. 

Si le match est un match "bye", elle appelle la méthode `handleByeMatch`. Si le match a un score, elle vérifie s'il s'agit d'un match "sm" (modifié par administrateur) et appelle la méthode `handleSmMatch` s'il s'agit de cela, ou continue à la prochaine vérification s'il ne l'est pas. 

Si le match n'a pas été joué (déterminé par une combinaison de l'abandon du match et de l'abandon de tous les matchs individuels ou de tous les joueurs de l'équipe adverse), elle appelle la méthode `handleForfeitedMatch`. 

Si aucune de ces conditions n'est remplie, la méthode `handleMatch` est appelée.

La méthode `addMatchToPlayer` ajoute des données sur les performances d'un joueur lors d'un match à l'objet `PlayersPointsProcessingModel`. Elle prend en entrée l'index unique du joueur, son nom, son club, sa division, sa semaine, son ID de match, son ID de match unique et le nombre de points que le joueur a marqué lors du match. Elle incrémente également un compteur du nombre de matchs que le joueur a joués.

Les méthodes `handleSmMatch` et `handleForfeitedMatch` appellent toutes les deux la méthode `addMatchToPlayer` avec certains valeurs de points prédéfinies (3 points et 4 points, respectivement). La méthode `handleMatch` utilise la classe `PointsHelper` pour calculer les points de chaque joueur en fonction des données du match.

# TODO UNIT TEST WITH those Matches

NH18/043
NH09/026 FG-FG
LgH08/336 sm