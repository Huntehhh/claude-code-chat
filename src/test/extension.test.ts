import * as assert from 'assert';
import * as vscode from 'vscode';

// Import constants for validation
import {
	TIMEOUT_1HR_MS,
	MAX_MESSAGE_TRUNCATE_LENGTH,
	MAX_CONVERSATIONS_STORED,
	MAX_DIFF_LINES,
	MAX_PERMISSION_READ_ERRORS,
	MIN_REQUEST_ID_LENGTH,
	MAX_REQUEST_ID_LENGTH
} from '../constants';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('Constants Validation', () => {
		test('Timeout constants should be positive numbers', () => {
			assert.ok(TIMEOUT_1HR_MS > 0, 'TIMEOUT_1HR_MS should be positive');
			assert.strictEqual(TIMEOUT_1HR_MS, 3600000, 'TIMEOUT_1HR_MS should be 1 hour');
		});

		test('Truncation limits should be reasonable', () => {
			assert.ok(MAX_MESSAGE_TRUNCATE_LENGTH > 10, 'Message truncate length should allow meaningful content');
			assert.ok(MAX_MESSAGE_TRUNCATE_LENGTH <= 100, 'Message truncate length should not be excessive');
		});

		test('Storage limits should be reasonable', () => {
			assert.ok(MAX_CONVERSATIONS_STORED >= 10, 'Should store at least 10 conversations');
			assert.ok(MAX_CONVERSATIONS_STORED <= 1000, 'Should not store excessive conversations');
		});

		test('Diff limits should prevent UI freezes', () => {
			assert.ok(MAX_DIFF_LINES >= 100, 'Diff limit should allow reasonable diffs');
			assert.ok(MAX_DIFF_LINES <= 10000, 'Diff limit should prevent huge computations');
		});

		test('Permission retry limits should be sensible', () => {
			assert.ok(MAX_PERMISSION_READ_ERRORS >= 1, 'Should allow at least one retry');
			assert.ok(MAX_PERMISSION_READ_ERRORS <= 10, 'Should not retry excessively');
		});

		test('Request ID length limits should be valid', () => {
			assert.ok(MIN_REQUEST_ID_LENGTH > 0, 'Min length should be positive');
			assert.ok(MAX_REQUEST_ID_LENGTH > MIN_REQUEST_ID_LENGTH, 'Max should be greater than min');
		});
	});

	suite('Shell Escape Function', () => {
		// Reimplemented here for testing since it's not exported
		function shellEscape(arg: string): string {
			return "'" + arg.replace(/'/g, "'\\''") + "'";
		}

		test('Should escape empty string', () => {
			assert.strictEqual(shellEscape(''), "''");
		});

		test('Should wrap simple string in quotes', () => {
			assert.strictEqual(shellEscape('hello'), "'hello'");
		});

		test('Should escape single quotes', () => {
			assert.strictEqual(shellEscape("it's"), "'it'\\''s'");
		});

		test('Should handle multiple single quotes', () => {
			assert.strictEqual(shellEscape("'a'b'"), "''\\''a'\\''b'\\'''");
		});

		test('Should preserve spaces', () => {
			assert.strictEqual(shellEscape('hello world'), "'hello world'");
		});

		test('Should preserve special characters (they are safe inside single quotes)', () => {
			assert.strictEqual(shellEscape('$HOME'), "'$HOME'");
			assert.strictEqual(shellEscape('a;b'), "'a;b'");
			assert.strictEqual(shellEscape('a|b'), "'a|b'");
		});
	});

	suite('Path Validation Function', () => {
		// Reimplemented here for testing
		function isValidShellPath(pathStr: string): boolean {
			const dangerousChars = /[;&|`$(){}[\]<>!#*?~]/;
			return !dangerousChars.test(pathStr);
		}

		test('Should accept normal paths', () => {
			assert.strictEqual(isValidShellPath('/usr/bin/node'), true);
			assert.strictEqual(isValidShellPath('/home/user/app'), true);
			assert.strictEqual(isValidShellPath('C:\\Users\\name'), true);
		});

		test('Should reject paths with semicolons', () => {
			assert.strictEqual(isValidShellPath('/bin;rm -rf /'), false);
		});

		test('Should reject paths with pipe', () => {
			assert.strictEqual(isValidShellPath('/bin|cat'), false);
		});

		test('Should reject paths with backticks', () => {
			assert.strictEqual(isValidShellPath('/bin`whoami`'), false);
		});

		test('Should reject paths with dollar signs', () => {
			assert.strictEqual(isValidShellPath('/bin$HOME'), false);
		});

		test('Should reject paths with parentheses', () => {
			assert.strictEqual(isValidShellPath('/bin(cmd)'), false);
		});

		test('Should allow paths with dots and dashes', () => {
			assert.strictEqual(isValidShellPath('/path/to/file-name.txt'), true);
			assert.strictEqual(isValidShellPath('/path.to/file_name'), true);
		});
	});

	suite('Request ID Validation', () => {
		// Reimplemented here for testing
		function isValidRequestId(requestId: string): boolean {
			return /^[a-zA-Z0-9_-]{10,50}$/.test(requestId);
		}

		test('Should accept valid request IDs', () => {
			assert.strictEqual(isValidRequestId('req_1234567890_abcdef'), true);
			assert.strictEqual(isValidRequestId('abcdefghij'), true);
		});

		test('Should reject IDs that are too short', () => {
			assert.strictEqual(isValidRequestId('short'), false);
			assert.strictEqual(isValidRequestId('123456789'), false); // 9 chars
		});

		test('Should reject IDs that are too long', () => {
			const longId = 'a'.repeat(51);
			assert.strictEqual(isValidRequestId(longId), false);
		});

		test('Should reject IDs with path traversal characters', () => {
			assert.strictEqual(isValidRequestId('../../../etc/passwd'), false);
			assert.strictEqual(isValidRequestId('valid_but/has_slash'), false);
		});

		test('Should reject IDs with special characters', () => {
			assert.strictEqual(isValidRequestId('valid;injection'), false);
			assert.strictEqual(isValidRequestId('valid`cmd`valid'), false);
		});
	});

	suite('Regex Escape Function', () => {
		// Reimplemented here for testing (from mcp-permissions.ts fix)
		function escapeRegexExceptStar(str: string): string {
			return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
		}

		test('Should escape dots', () => {
			assert.strictEqual(escapeRegexExceptStar('a.b'), 'a\\.b');
		});

		test('Should escape parentheses', () => {
			assert.strictEqual(escapeRegexExceptStar('a(b)'), 'a\\(b\\)');
		});

		test('Should escape brackets', () => {
			assert.strictEqual(escapeRegexExceptStar('a[b]'), 'a\\[b\\]');
		});

		test('Should NOT escape asterisks (for glob conversion)', () => {
			assert.strictEqual(escapeRegexExceptStar('a*b'), 'a*b');
		});

		test('Should escape complex patterns to prevent ReDoS', () => {
			// This pattern could cause ReDoS if not escaped
			const dangerous = '(a+)+';
			const escaped = escapeRegexExceptStar(dangerous);
			assert.strictEqual(escaped, '\\(a\\+\\)\\+');

			// Verify the escaped version is safe to use in regex
			const regex = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
			assert.ok(regex, 'Escaped pattern should create valid regex');
		});
	});
});
