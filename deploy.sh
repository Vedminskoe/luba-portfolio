#!/usr/bin/env bash
# Заливка сайта на сервер. Отправляется то, что закоммичено в ветке master.
# Запуск из папки проекта:  ./deploy.sh
set -euo pipefail

SERVER=vedminskoe                     # алиас из ~/.ssh/config
REMOTE_DIR=/var/www/luba-portfolio    # папка сайта на сервере
BRANCH=master

# Предупреждение, если есть незакоммиченные правки
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠  Есть незакоммиченные изменения — на сервер уйдёт только закоммиченное в $BRANCH."
  echo "   Сначала: git add -A && git commit -m \"...\" && git push"
  read -p "   Всё равно заливать? [y/N] " ok
  [ "$ok" = "y" ] || { echo "Отменено."; exit 1; }
fi

echo "→ Заливаю $BRANCH на $SERVER:$REMOTE_DIR ..."
git archive --format=tar "$BRANCH" \
  | ssh "$SERVER" "rm -rf $REMOTE_DIR/* && tar -x -C $REMOTE_DIR && chown -R www-data:www-data $REMOTE_DIR"

echo "✓ Готово: https://portfolio.unumgarden.ru"
