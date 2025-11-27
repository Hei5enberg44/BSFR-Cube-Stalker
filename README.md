<h1>bsfr-cube-stalker</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-5.34.0-blue.svg?cacheSeconds=2592000" />
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

**Paramètres :**

| Nom      | Obligatoire | Contenu                   |
| -------- | :---------: | ------------------------- |
| **page** |             | Numéro de page à afficher |

**Exemples :**

```
/help
/help page:2
```

---

- ### /link : Lie un profil ScoreSaber/BeatLeader à votre compte Discord

Permet de lier un profil ScoreSaber ou BeatLeader à votre compte Discord.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                 |
| --------------- | :---------: | ------------------------------------------------------- |
| **leaderboard** |     ☑      | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |

**Exemples :**

```
/link leaderboard:ScoreSaber
/link leaderboard:BeatLeader
```

---

- ### /unlink : Délie le profil ScoreSaber/BeatLeader d'un membre Discord

Permet de délier le profil ScoreSaber ou BeatLeader d'un membre Discord.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                 |
| --------------- | :---------: | ------------------------------------------------------- |
| **leaderboard** |     ☑      | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **joueur**      |             | Membre de la guild à délier (Staff uniquement)          |

**Exemples :**

```
/unlink leaderboard:ScoreSaber
/unlink leaderboard:BeatLeader joueur:@Hei5enberg#6969
```

---

- ### /setprofile : Lie un profil ScoreSaber/BeatLeader à un membre Discord

Permet de lier un profil ScoreSaber ou BeatLeader à un membre Discord.

**Paramètres :**

| Nom                  | Obligatoire | Contenu                                                 |
| -------------------- | :---------: | ------------------------------------------------------- |
| **leaderboard**      |     ☑      | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |
| **lien_leaderboard** |     ☑      | Lien du profil ScoreSaber ou BeatLeader                 |
| **joueur**           |     ☑      | Membre de la guild à lier                               |

**Exemples :**

```
/setprofile leaderboard:ScoreSaber lien_leaderboard:https://scoresaber.com/u/76561198125542519 joueur:@Hei5enberg#6969
/setprofile leaderboard:BeatLeader lien_leaderboard:https://beatleader.com/u/76561198125542519 joueur:@Hei5enberg#6969
```

---

- ### /me : Affiche vos informations de joueur

Permet d'afficher vos informations de joueur ou celles d'un autre joueur.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                                |
| --------------- | :---------: | ---------------------------------------------------------------------- |
| **leaderboard** |             | Choix du leaderboard entre `ScoreSaber` _(par défaut)_ et `BeatLeader` |
| **joueur**      |             | Joueur pour lequel afficher les informations                           |

**Exemples :**

```
/me
/me leaderboard:BeatLeader
/me leaderboard:BeatLeader joueur:@Hei5enberg#6969
```

---

- ### /ld : Affiche le classement du serveur

Permet d'afficher le classement des membres du serveur pour un leaderboard donné.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                                |
| --------------- | :---------: | ---------------------------------------------------------------------- |
| **classement**  |     ☑      | Choix entre `Points de performance` et `Précision`                     |
| **leaderboard** |             | Choix du leaderboard entre `ScoreSaber` _(par défaut)_ et `BeatLeader` |
| **page**        |             | Page à afficher                                                        |

**Exemples :**

```
/ld classement:Points de performance
/ld classement:Précision leaderboard:BeatLeader page:2
```

---

- ### /world : Affiche le classement mondial

Permet d'afficher le classement mondial pour un leaderboard donné.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                                |
| --------------- | :---------: | ---------------------------------------------------------------------- |
| **leaderboard** |             | Choix du leaderboard entre `ScoreSaber` _(par défaut)_ et `BeatLeader` |
| **nombre**      |             | Nombre de joueurs à afficher _(10 par défaut, 20 maximum)_             |

**Exemples :**

```
/world
/world leaderboard:BeatLeader nombre:15
```

---

- ### /locateworld : Affiche votre position dans le classement mondial

Permet d'afficher votre position ou celle d'un autre joueur dans le classement mondial pour un leaderboard donné.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                                |
| --------------- | :---------: | ---------------------------------------------------------------------- |
| **leaderboard** |             | Choix du leaderboard entre `ScoreSaber` _(par défaut)_ et `BeatLeader` |
| **joueur\***    |             | Affiche la position d'un autre membre                                  |
| **rang\***      |             | Affiche la position d'un joueur par rapport à son rang                 |

`*`: Les paramètres **joueur** et **rang** ne peuvent pas être combinés

**Exemples :**

```
/locateworld
/locateworld leaderboard:BeatLeader
/locateworld joueur:@Hei5enberg#6969
/locateworld leaderboard:BeatLeader rang:50
```

---

- ### /top1 : S'inscrire ou se désinscrire du top 1 pays

Permet de s'inscrire au top 1 pays afin que vos tops 1 de votre pays soient publiés dans le channel #top-1-pays.

**Paramètres :**

| Nom           | Obligatoire | Contenu                                                 |
| ------------- | :---------: | ------------------------------------------------------- |
| **subscribe** |     ☑      | Boolean _(`true`: s'inscrire, `false`: se désinscrire)_ |

**Exemples :**

```
/top1 subscribe:true
/top1 subscribe:false
```

---

- ### /playlist played : Créer une playlist à partir des maps jouées du joueur

Permet de générer une playlist de maps en fonction du nombre d'étoiles et/ou de l'accuracy du joueur sur celles-ci.

**Exemples :**

```
/playlist played
```

---

- ### /playlist ranked : Créer une playlist à partir des maps ranked

Permet de générer une playlist de maps ranked en fonction du nombre d'étoiles sur celles-ci.

**Exemples :**

```
/playlist ranked
```

---

- ### /playlist snipe : Créer une playlist de maps à sniper

Permet de générer une playlist de maps à sniper par rapport aux scores d'un autre joueur.

**Exemples :**

```
/playlist snipe
```

---

- ### /playlist clan-wars : Créer une playlist de maps à conquerir

Permet de génénérer une playlist de maps à capturer pour la guerre de clans BeatLeader.

**Exemples :**

```
/playlist clan-wars
```

---

- ### /forcerefresh : Actualise l'ensemble du serveur

Permet d'actualiser les rôles de pp de tous les membres ayant lié leur profil ScoreSaber ou BeatLeader avec leur compte Discord.

**Paramètres :**

| Nom             | Obligatoire | Contenu                                                 |
| --------------- | :---------: | ------------------------------------------------------- |
| **leaderboard** |     ☑      | Choix du leaderboard entre `ScoreSaber` et `BeatLeader` |

**Exemples :**

```
/forcerefresh leaderboard:ScoreSaber
```

---

- ### /clan invitation : Envoi une invitation au joueur à rejoindre le clan BSFR sur BeatLeader

Permet d'envoyer une demande au joueur à rejoindre le clan BSFR sur BeatLeader.
Après avoir exécuter la commande, le joueur peut ensuite accepter l'invitation depuis ses notifications sur le site de BeatLeader.

**Exemples :**

```
/clan invitation
```

## Auteur

👤 **hei5enberg**

- Site Web: [bsaber.fr](https://bsaber.fr)
- Twitter: [@BltAntoine](https://twitter.com/BltAntoine)
- BlueSky: [@hei5enberg.bsky.social](https://bsky.app/profile/hei5enberg.bsky.social)
- Github: [@hei5enberg44](https://github.com/hei5enberg44)
