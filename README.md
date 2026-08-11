# Palpitômetro

App PWA de previsões de resultados desportivos (ligas europeias via API-Football + Girabola manual).

## Publicar no Vercel (recomendado)

1. Cria uma conta em vercel.com (podes usar login do GitHub)
2. Sobe esta pasta para um repositório no GitHub:
   ```
   cd palpitometro
   git init
   git add .
   git commit -m "Palpitômetro inicial"
   git branch -M main
   git remote add origin <URL-do-teu-repositorio>
   git push -u origin main
   ```
3. No Vercel: "Add New Project" → escolhe o repositório → Vercel deteta Vite automaticamente → "Deploy"
4. Em poucos minutos tens um link tipo `palpitometro.vercel.app`

## Testar localmente antes de publicar

Precisas de ter Node.js instalado no teu computador:
```
npm install
npm run dev
```
Abre o link que aparecer no terminal (normalmente http://localhost:5173).

## Adicionar ao ecrã principal do telemóvel (instalar como app)

1. Abre o link publicado no navegador do telemóvel (Chrome no Android, Safari no iPhone)
2. Android: menu (⋮) → "Adicionar ao ecrã principal" / "Instalar app"
3. iPhone: botão de partilha → "Adicionar ao ecrã principal"

## Importante — chave de API

A chave da API-Football está directamente no código (`src/App.jsx`). Isto é aceitável para testar,
mas fica visível a quem inspecionar o código da página. Antes de divulgares o link publicamente,
o recomendável é mover as chamadas à API para uma função de servidor (Vercel Functions), para a
chave nunca ficar exposta no browser.
