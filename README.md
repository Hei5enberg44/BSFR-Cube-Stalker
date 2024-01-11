<h1>bsfr-cube-stalker</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-5.21.2-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href="https://twitter.com/BltAntoine" target="_blank">
    <img alt="Twitter: BltAntoine" src="https://img.shields.io/twitter/follow/BltAntoine.svg?style=social" />
  </a>
</p>

> Bot permettant d'afficher les statistiques de joueurs sur ScoreSaber ou BeatLeader

## Installation

```sh
apt install dh-autoreconf
npm install
```

## Configuration

Compléter le fichier `config.json` à la racine du projet avec les données correspondantes au serveur.

## Liste des commandes

- ### /help : Affiche l'aide

Permet d'afficher la liste des commandes et leur fonction.

__Exemples :__

```
/help
```

***

- ### /link : Lie un profil ScoreSaber/BeatLeader à votre compte Discord

Permet de lier un profil ScoreSaber ou BeatLeader à votre compte Discord.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** | ☑ | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **lien_leaderboard** | ☑ | Lien du profil ScoreSaber ou BeatLeader |

__Exemples :__

```
/link leaderboard:ScoreSaber lien_leaderboard:https://scoresaber.com/u/76561198125542519
/link leaderboard:BeatLeader lien_leaderboard:https://beatleader.xyz/u/76561198125542519
```

***

- ### /unlink : Délie le profil ScoreSaber/BeatLeader d'un membre Discord

Permet de délier le profil ScoreSaber ou BeatLeader d'un membre Discord.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** | ☑ | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **joueur** |   | Membre de la guild à délier (Staff uniquement) |

__Exemples :__

```
/unlink leaderboard:ScoreSaber
/unlink leaderboard:BeatLeader joueur:@Hei5enberg#6969
```

***

- ### /setprofile : Lie un profil ScoreSaber/BeatLeader à un membre Discord

Permet de lier un profil ScoreSaber ou BeatLeader à un membre Discord.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** | ☑ | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **lien_leaderboard** | ☑ | Lien du profil ScoreSaber ou BeatLeader |
| **joueur** | ☑ | Membre de la guild à lier |

__Exemples :__

```
/setprofile leaderboard:ScoreSaber lien_leaderboard:https://scoresaber.com/u/76561198125542519 joueur:@Hei5enberg#6969
/setprofile leaderboard:BeatLeader lien_leaderboard:https://beatleader.xyz/u/76561198125542519 joueur:@Hei5enberg#6969
```

***

- ### /me : Affiche vos informations de joueur

Permet d'afficher vos informations de joueur ou celles d'un autre joueur.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** |   | Choix du leaderboard entre `ScoreSaber` *(par défaut)* et `BeatLeader` |
| **joueur** |   | Joueur pour lequel afficher les informations |

__Exemples :__

```
/me
/me leaderboard:BeatLeader
/me leaderboard:BeatLeader joueur:@Hei5enberg#6969
```

***

- ### /ld : Affiche le classement du serveur

Permet d'afficher le classement des membres du serveur pour un leaderboard donné.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **classement** | ☑ | Choix entre `Points de performance` et `Précision` |
| **leaderboard** |   | Choix du leaderboard entre `ScoreSaber` *(par défaut)* et `BeatLeader` |
| **page** |   | Page à afficher |

__Exemples :__

```
/ld classement:Points de performance
/ld classement:Précision leaderboard:BeatLeader page:2
```

***

- ### /world : Affiche le classement mondial

Permet d'afficher le classement mondial pour un leaderboard donné.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** |   | Choix du leaderboard entre `ScoreSaber` *(par défaut)* et `BeatLeader` |
| **nombre** |   | Nombre de joueurs à afficher *(10 par défaut, 20 maximum)* |

__Exemples :__

```
/world
/world leaderboard:BeatLeader nombre:15
```

***

- ### /locateworld : Affiche votre position dans le classement mondial

Permet d'afficher votre position ou celle d'un autre joueur dans le classement mondial pour un leaderboard donné.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** |   | Choix du leaderboard entre `ScoreSaber` *(par défaut)* et `BeatLeader` |
| **joueur*** |   | Affiche la position d'un autre membre |
| **rang*** |   | Affiche la position d'un joueur par rapport à son rang |

`*`: Les paramètres **joueur** et **rang** ne peuvent pas être combinés

__Exemples :__

```
/locateworld
/locateworld leaderboard:BeatLeader
/locateworld joueur:@Hei5enberg#6969
/locateworld leaderboard:BeatLeader rang:50
```

***

- ### /top1 : S'inscrire ou se désinscrire du top 1 pays

Permet de s'inscrire au top 1 pays afin que vos tops 1 de votre pays soient publiés dans le channel #top-1-pays.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **subscribe** | ☑ | Boolean *(`true`: s'inscrire, `false`: se désinscrire)* |

__Exemples :__

```
/top1 subscribe:true
/top1 subscribe:false
```

***

- ### /playlist played : Créer une playlist à partir des maps jouées du joueur

Permet de générer une playlist de maps en fonction du nombre d'étoiles et/ou de l'accuracy du joueur sur celles-ci.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** | ☑ | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **min_stars** |   | Nombre d'étoiles minimum |
| **max_stars** |   | Nombre d'étoiles maximum |
| **min_acc** |   | Accuracy minimum |
| **max_acc** |   | Accuracy maximum |

__Exemples :__

```
/playlist played stars_min:8 stars_max:10 acc_min:90 acc_max:94
```

***

- ### /playlist ranked : Créer une playlist à partir des maps ranked

Permet de générer une playlist de maps ranked en fonction du nombre d'étoiles sur celles-ci.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** | ☑ | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **min_stars** |   | Nombre d'étoiles minimum |
| **max_stars** |   | Nombre d'étoiles maximum |

__Exemples :__

```
/playlist ranked stars_min:8 stars_max:10
```

***

- ### /playlist snipe : Créer une playlist de maps à sniper

Permet de générer une playlist de maps à sniper par rapport aux scores d'un autre joueur.

__Paramètres :__

|    Nom    | Obligatoire | Contenu |
| --------- |:-----------:| ------- |
| **leaderboard** | ☑ | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **joueur** | ☑ | Joueur à sniper |

__Exemples :__

```
/playlist snipe leaderboard:ScoreSaber joueur:@Hei5enberg
/playlist snipe leaderboard:BeatLeader joueur:@Hei5enberg
```

***

- ### /forcerefresh : Actualise l'ensemble du serveur

Permet d'actualiser les rôles de pp de tous les membres ayant lié leur profil ScoreSaber ou BeatLeader avec leur compte Discord.

__Exemples :__

```
/forcerefresh
```

## Auteur

👤 **Hei5enberg#6969**

* Site Web: [bsaber.fr](https://bsaber.fr)
* Twitter: [@BltAntoine](https://twitter.com/BltAntoine)
* Github: [@hei5enberg44](https://github.com/hei5enberg44)