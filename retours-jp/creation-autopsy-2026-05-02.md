# Autopsie de creation -- Ernie Studio

## Contexte

- **Projet** : `/Users/alex/Claude/projets-heberges/ernie/`
- **Depot distant** : `github.com/Alexmacapple/Ernie-Image`
- **Sessions analysees** : 5 sessions Claude Code, du 26 avril au 28 avril 2026
- **Volume total transcripts** : ~5,2 Mo
- **Commits git** : 16 commits du 27 au 28 avril 2026

| Session | Date | Taille | Contenu principal |
|---------|------|--------|-------------------|
| `9dc7427f` | 26 avr. 20:10 | 272 Ko | Genese, exploration repo Sandjab |
| `4ddc7141` | 26 avr. 20:22 | 2,9 Mo | Construction complete de l'app |
| `e2c9d7a2` | 26 avr. 22:13 | 1,1 Mo | PRD-112 et PRD-113, question MLX |
| `d0eddbf7` | 27 avr. 07:00 | 332 Ko | Git, push GitHub, droits Sandjab |
| `aa79177e` | 27 avr. 21:48 | 1,5 Mo | Pipeline de prompts, tests |

## Genese

Le projet Ernie Studio est ne le 26 avril 2026 d'une conversation entre Alex et Jean-Paul Gavini. JP avait developpe deux scripts CLI dans un repo GitHub (`Sandjab/Ernie`) pour faire tourner le modele de generation d'images ERNIE-Image de Baidu : un en PyTorch standard et un optimise MLX pour Apple Silicon.

Alex partageait des messages WhatsApp de JP avec les benchmarks :

> "Teste en quantize 8 (43s) et 4 (44s) donc quantize inutile en MLX"
> "Je testais en steps 8. En steps 4 forcement ca met la moitie du temps. Donc 21.4s sur un M3 Ultra"

Le prompt fondateur d'Alex posait la question de fond :

> "Ma question c'est un serveur local de model de diffusion idealement en headless, donc pas A111->SD webui->Forge (et autres descendants) et pas Comfy"

L'objectif etait clair : une API de generation d'images propre, sans les interfaces lourdes du monde Stable Diffusion.

## Chronologie

### Session 9dc7427f -- 26 avril 2026, 20:10 (272 Ko)

**Session fondatrice.** Alex partage les messages WhatsApp de JP Gavini. Claude explore le repo GitHub `Sandjab/Ernie` (pas clone, juste un fichier `.webloc`) et identifie que les scripts sont des "CLIs pures" sans serveur.

Claude propose trois options pour le serveur headless et recommande **FastAPI maison enveloppant le code de JP**. Decision prise en moins de 2 minutes.

Un malentendu hardware survient : Claude suppose un M3 Ultra. Alex corrige avec le `system_profiler` complet -- c'est un **M1 Ultra 64 Go, 48 coeurs GPU**. Claude ajuste.

Alex demande une explication pedagogique : "D'abord explique moi ce qu'a fait JP car j'ai rien compris". Claude produit `ernie-image-explique.md`.

La session se termine par le deplacement du projet de `git-hors-workflow/Ernie/` vers `projets-heberges/ernie/`.

### Session 4ddc7141 -- 26 avril 2026, 20:22 (2,9 Mo)

**Session marathon de construction.** C'est la session la plus dense -- 2,9 Mo de transcript avec 2 continuations de contexte.

**Phase 1 -- Fondations** (20:22-20:58) :
- "On va travailler ici /Users/alex/Claude/projets-heberges/ernie/CLAUDE.md"
- "complete le claude.md avec https://github.com/Sandjab/Ernie"
- Reorganisation des docs dans `docs/`
- Alex demande d'aligner l'architecture sur ses autres projets : "Sur les autres projets /Users/alex/Claude/projets-heberges/ j'utilise des fast Api un back un middle ware et un front DSFR cf /Users/alex/Claude/projets-heberges/omni-num la j'aimerai qu'on construise l'API avec toutes les roots puis l'interface fron"
- PRD-111 cree via le skill `/prd`
- Discussion sur le chargement du pipeline : "Le pipeline MLX prend 41s a generer mais 20-30s a charger"
- Alex veut les modeles dans le projet : "Je voudrais que tout se charge ici /Users/alex/Claude/projets-heberges/ernie plutot qu'ailleurs"
- "Penses a faire un claude.md methode karpathy" -- invocation du skill `/distiller-claude-md`

**Phase 2 -- UX et polissage** (21:04-21:40) :
- Invocation du skill `/ux-checklist` pour verifier les bonnes pratiques
- Frictions sur le bouton de generation : "Ameliore l'UI le bouton pour lancer le prompt n'est pas tres clair", "je vois pas le changement", "J'ai pas le bouton DSFR"
- Bug de generation concurrente : "Erreur de generation -- Une generation est deja en cours"
- Demandes successives : telecharger l'image, visualiser le prompt de chaque image, aligner les checkbox
- Chaque ajout passe par le skill UX checklist

**Phase 3 -- Evaluation et finalisation** (21:40-22:10) :
- "Evalue le depot de code"
- "Liste moi toutes les fonctionnalite API"

### Session e2c9d7a2 -- 26 avril 2026, 22:13 (1,1 Mo)

**Enrichissement de l'API.** Session plus reflexive, orientee contrat API.

- Alex partage des notes structurees sur les parametres ERNIE-Image (seed, guidance_scale, num_inference_steps, Prompt Enhancer) et demande : "Est-ce qu'on a tout implemente ?"
- Creation du **PRD-112** (contrat API enrichi) via le skill `/prd` : seed explicite, guidance, steps
- Creation du **PRD-113** (UX prompting guide) : aide au prompt structuree, accordeon DSFR retractable
- Question strategique : "Est-ce que le MLX m'est indispensable ?"
- Relecture et validation des deux PRD : "Relis les deux PRD"

### Session d0eddbf7 -- 27 avril 2026, 07:00 (332 Ko)

**Mise en production.** Session matinale, courte et operationnelle.

- "va dans le projet Ernie dans les projets heberges"
- "Versionne le projet Ernie sur git projet autonome" -- push vers `github.com/Alexmacapple/Ernie-Image`
- Ajout de JP comme collaborateur : "Ensuite donne les droits a https://github.com/Sandjab sur https://github.com/Alexmacapple/Ernie-Image"
- Problemes d'authentification GitHub depuis le Mac Studio (pas le Mac Mini) : "je suis loguee pourtant comprends pas"
- Resolution manuelle via `gh api` : "Fais donne les droits a https://github.com/Sandjab"
- Verification des droits via l'interface web : "y a pas les droits", "je vois pas l'option"

### Session aa79177e -- 27 avril 2026, 21:48 (1,5 Mo)

**Pipeline de prompts et tests.** Session creative, centree sur la qualite des prompts generes.

- Premier test reel de prompt : "Fais un prompt image pour ERNIE Studio en appliquant les skills prompt-image puis ernie-image. Sujet : femme de 50 ans qui joue du ukulele dans un appartement parisien."
- "va y decline 3 en option prompt ernie"
- "Traduis en fr" -- lecture du prompt genere pour validation
- Friction sur la qualite : "le ukulele est chelou" -- retour critique sur le rendu
- Amelioration du skill `prompt-image` suite aux retours d'evaluation (score 58/65 a 63/65)
- Construction de la **chaine de prompts** : lexique-precis -> prompt-image -> ernie-image -> ernie-studio-presets
- Demande de versions courte et longue du pipeline d'invocation
- "enleve les traces de versionnages workflow de mes skills" -- nettoyage pour commit dans le depot Ernie
- Version generique du pipeline sans chemins absolus
- "Maintenant push tout commit tout local distant depot dedie"

## Pivots et decisions cles

1. **26 avril 20:10 -- FastAPI plutot que Gradio ou ComfyUI** : des le premier prompt, les alternatives (A1111, SD WebUI, Forge, ComfyUI) sont explicitement ecartees. FastAPI maison est choisi pour le headless pur.

2. **26 avril 20:14 -- MLX comme backend** : malgre le gain mesure par JP surtout sur M3 Ultra, le choix MLX est confirme pour le M1 Ultra 64 Go. Le pipeline hybride (text encoder PyTorch+MPS, DiT+VAE MLX) en decoule.

3. **26 avril 20:19 -- Deplacement vers projets-heberges** : le projet quitte `git-hors-workflow/` pour `projets-heberges/ernie/`, signalant le passage de l'exploration au projet heberge.

4. **26 avril 20:32 -- Alignement sur l'ecosysteme existant** : Alex demande explicitement d'aligner l'architecture sur OmniStudio (`omni-num`), ce qui impose FastAPI + DSFR + middleware.

5. **26 avril 20:51 -- Modeles dans le projet** : decision de forcer `HF_HUB_CACHE` vers `models/` dans le projet plutot que `~/.cache/huggingface`, pour isoler le stockage.

6. **26 avril 22:20 -- Question MLX** : Alex interroge la necessite du MLX. La reponse confirme que MLX est indispensable pour le pipeline actuel (le text encoder reste PyTorch+MPS mais le DiT et le VAE sont en MLX).

7. **27 avril 07:01 -- Depot autonome** : creation du repo `Alexmacapple/Ernie-Image` avec droits en ecriture pour `Sandjab` (JP Gavini).

8. **27 avril 22:16 -- Chaine de prompts formalisee** : mise en place du workflow Skills dans l'ordre : lexique-precis -> prompt-image -> ernie-image -> ernie-studio-presets.

## Choix abandonnes

- **A1111 / SD WebUI / Forge** : ecartes dans le prompt fondateur ("pas A111->SD webui->Forge")
- **ComfyUI** : ecarte explicitement ("pas Comfy")
- **Gradio / diffusion-pipe** : ecartes car trop opinionated sur l'UI
- **Quantization MLX** : ecartee apres les benchmarks de JP (43s en 8-bit vs 44s en 4-bit -- "quantize inutile en MLX")
- **Diffusers comme backend** : documente comme "piste valide mais a traiter comme spike separe"
- **Bouton DSFR non fonctionnel** : plusieurs iterations necessaires ("je vois pas le changement", "J'ai pas le bouton DSFR") avant d'obtenir le bon rendu

## Frictions notables

- **Malentendu hardware** : Claude suppose M3 Ultra, Alex possede M1 Ultra 64 Go. Corrige par copier-coller du `system_profiler`.
- **Bouton de generation DSFR** : au moins 3 iterations avant un bouton fonctionnel et visible.
- **Droits GitHub collaborateur** : la commande `gh api` ne fonctionnait pas depuis le Mac Studio, resolution manuelle via l'interface web.
- **Ukulele "chelou"** : le prompt genere pour le test ukulele n'etait pas satisfaisant, conduisant a l'amelioration du skill prompt-image.
- **Continuations de contexte** : la session marathon `4ddc7141` a subi 2 continuations (saturation du contexte), suggerant une session tres longue et dense.

## Etat final

### Artefacts produits

**Application web** (FastAPI + DSFR, auth Keycloak, pipeline MLX) :
- `app/main.py` -- point d'entree FastAPI
- `app/pipeline_mlx.py` -- pipeline de generation MLX
- `app/auth.py` -- integration Keycloak (realm `harmonia`, client `omnistudio`)
- `frontend/` -- interface DSFR avec galerie, lightbox, aide au prompt

**Documentation** :
- `docs/ernie-image-explique.md` -- explication pedagogique du modele (pour JP)
- `docs/serveur-headless-ernie.md` -- decision architecture
- `docs/API-REFERENCE-TECHNIQUE.md` -- reference API
- `docs/SPECS-MODELES.md` -- specifications des modeles

**PRDs** :
- `prd/PRD-111` -- conception initiale FastAPI + DSFR
- `prd/PRD-112` -- contrat API enrichi (seed, guidance, steps)
- `prd/PRD-113` -- UX prompting guide
- `prd/PRD-114` -- controle de representation visuelle (presets d'ancrage)
- `prd/PRD-115` -- batch prompts (brouillon)

**Skills de prompting** :
- `skills/prompt-image/` -- generation de prompts image
- `skills/ernie-image/` -- adaptation au moteur ERNIE
- `skills/ernie-studio-presets/` -- presets UI

**Infrastructure** :
- Port 8300, Keycloak sur 8082
- Scripts `start.sh` / `stop.sh`
- Modeles dans `models/` (~20 Go, gitignored)
- 7 presets de resolution (square, landscape, portrait, landscape-soft, portrait-soft, cinema, vertical)
- Temps de generation : ~41 secondes par image sur M1 Ultra 64 Go

## Annexe -- Conversations restituees

Les echanges textuels des 5 sessions principales sont disponibles au format iMessage dans le fichier HTML ci-joint, filtre du bruit technique (commandes shell, outputs de tests, system-reminders).

- [9dc7427f -- 26 avr. 20:10 -- Genese : exploration repo Sandjab, decision FastAPI + MLX](./creation-autopsy-2026-05-02-conversations.html#s9dc7427f)
- [4ddc7141 -- 26 avr. 20:22 -- Session marathon : construction complete de l'app](./creation-autopsy-2026-05-02-conversations.html#s4ddc7141)
- [e2c9d7a2 -- 26 avr. 22:13 -- Enrichissement API : PRD-112, PRD-113](./creation-autopsy-2026-05-02-conversations.html#se2c9d7a2)
- [d0eddbf7 -- 27 avr. 07:00 -- Mise en production : git, push GitHub, droits Sandjab](./creation-autopsy-2026-05-02-conversations.html#sd0eddbf7)
- [aa79177e -- 27 avr. 21:48 -- Pipeline de prompts : test ukulele, chaine de skills](./creation-autopsy-2026-05-02-conversations.html#saa79177e)
