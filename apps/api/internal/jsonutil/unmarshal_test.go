/*
 * Created on Mon Mar 22 2021
 *
 * MIT License
 *
 * Copyright (c) 2021, Christian Faustmann / neox5, <faustmannchr@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package jsonutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type testData struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func TestBodyTooLarge(t *testing.T) {
	t.Parallel()

	input := make(map[string]string, 1)
	input["padding"] = strings.Repeat("0", maxBodyBytes+10)

	largeJSON, err := json.Marshal(input)
	if err != nil {
		t.Fatal(err)
	}

	errors := []string{
		"http: request body too large",
	}
	unmarshalTestHelper(t, []string{string(largeJSON)}, errors, http.StatusRequestEntityTooLarge)
}

func TestInvalidHeader(t *testing.T) {
	t.Parallel()

	body := io.NopCloser(bytes.NewReader([]byte("")))
	r := httptest.NewRequest("POST", "/", body)
	r.Header.Set("content-type", "application/text")

	w := httptest.NewRecorder()
	data := &testData{}
	code, err := Unmarshal(w, r, data)

	expectedStatusCode := http.StatusUnsupportedMediaType
	expectedError := "content-type is not application/json"
	if code != expectedStatusCode {
		t.Errorf("unmarshal wanted %v response code, got %v", expectedStatusCode, code)
	}
	if err == nil || err.Error() != expectedError {
		t.Errorf("unmarshal expected error '%v', got %v", expectedError, err)
	}
}

func TestEmptyBody(t *testing.T) {
	t.Parallel()

	invalidJSON := []string{
		"",
	}
	errors := []string{
		"body must not be empty",
	}
	unmarshalTestHelper(t, invalidJSON, errors, http.StatusBadRequest)
}

func TestMultipleJson(t *testing.T) {
	t.Parallel()

	invalidJSON := []string{
		`
		{"id": "uuid1234", "name": "user3", "age": 31}
		{"id": "uuid312", "name": "user222", "age": 61}
		`,
	}
	errors := []string{
		"body must contain only one JSON object",
	}
	unmarshalTestHelper(t, invalidJSON, errors, http.StatusBadRequest)
}

func TestInvalidJson(t *testing.T) {
	t.Parallel()

	invalidJSON := []string{
		"What is this doing here?",                      // not json
		`{"id": "uuid1234", "name": "user3", "age": 31`, // missing closing bracket
		`{"id": "uuid1234", "name: "user3", "age": 31}`, // missing closing quote in second key
	}
	errors := []string{
		"malformed json at position 1",
		"malformed json",
		"malformed json at position 28",
	}
	unmarshalTestHelper(t, invalidJSON, errors, http.StatusBadRequest)
}

func TestInvalidStructure(t *testing.T) {
	t.Parallel()

	invalidJSON := []string{
		`{"id": "uuid1234", "name2": "user3", "age": 31}`,  // different key
		`{"id": 1234, "name": "user3", "age": 31}`,         // id is int
		`{"id": "uuid1234", "name": "user3", "age": "31"}`, // age is string
	}
	errors := []string{
		`unknown field "name2"`,
		`invalid value "id" at position 11`,
		`invalid value "age" at position 47`,
	}
	unmarshalTestHelper(t, invalidJSON, errors, http.StatusBadRequest)
}

func TestValidJson(t *testing.T) {
	t.Parallel()

	validJSON := []string{
		`{"id": "uuid1234", "name": "user3", "age": 31}`,
	}
	errors := []string{
		"",
	}
	unmarshalTestHelper(t, validJSON, errors, http.StatusOK)
}

func unmarshalTestHelper(t *testing.T, payloads []string, errors []string, expectedStatusCode int) {
	t.Helper()
	for i, testStr := range payloads {
		body := io.NopCloser(bytes.NewReader([]byte(testStr)))
		r := httptest.NewRequest("POST", "/", body)
		r.Header.Set("content-type", "application/json; charset=utf-8")

		w := httptest.NewRecorder()
		data := &testData{}
		code, err := Unmarshal(w, r, data)
		if code != expectedStatusCode {
			t.Errorf("unmarshal wanted %v response code, got %v", expectedStatusCode, code)
		}
		if errors[i] == "" {
			// No error expected for this test, bad if we got one.
			if err != nil {
				t.Errorf("expected no error for '%v', got %v", testStr, err)
			}
		} else {
			if err == nil {
				t.Errorf("wanted error '%v', got nil", errors[i])
			} else if err.Error() != errors[i] {
				t.Errorf("expected error '%v', got: %v", errors[i], err)
			}
		}
	}
}
