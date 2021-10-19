prepare: lint test format build

lint:
	@npm run lint

format:
	@npm run format

test:
	@npm run test

build:
	@npm run build

commit:
	@git add -A
	@git commit -m "Version bump"

pushall:
	@git push && git push --tags

version-patch: lint format
	@cd ./libs/ezzy-web-crypto; \
	npm version patch
	@$(MAKE) "commit"
	@npm version patch
	@$(MAKE) "pushall"

version-minor: lint format
	@cd ./libs/ezzy-web-crypto; \
	npm version minor
	@$(MAKE) "commit"
	@npm version minor
	@$(MAKE) "pushall"

version-major: lint format
	@cd ./libs/ezzy-web-crypto; \
	npm version major
	@$(MAKE) "commit"
	@npm version major
	@$(MAKE) "pushall"

publish: prepare
	@npm publish ./dist/libs/ezzy-web-crypto