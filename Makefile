JS_FILES = $(shell find ./lib | grep index.js && find lib | grep .js)
TESTS = `find test -name *.test.js `
DOC_COMMAND=java -jar ./support/jsdoc/jsrun.jar ./support/jsdoc/app/run.js -t=./support/jsdoc/templates/jsdoc -d=./docs
CURR_DIR = $(shell pwd)
test:
	for file in $(TESTS) ; do \
		echo RUNNING $$(basename $$file) ; \
		cd $(CURR_DIR)/./$$(dirname $$file) ; \
        node ./$$(basename $$file) ; \
	done

docs:
	$(DOC_COMMAND) $(JS_FILES)

docclean :
	rm -rf docs

.PHONY: test docs docclean



