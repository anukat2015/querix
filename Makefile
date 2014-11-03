REPORTER = xunit-file

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) --recursive

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) --recursive \
		--watch

.PHONY: test test-w
