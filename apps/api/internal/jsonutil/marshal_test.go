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
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/go-cmp/cmp"
)

func TestEscapeJSON(t *testing.T) {
	t.Parallel()

	want := `{\"a\": \"b\"}`
	got := escapeJSON(`{"a": "b"}`)
	if diff := cmp.Diff(want, got); diff != "" {
		t.Errorf("escape json mismatch (-want +got):\n%v", diff)
	}
}

func TestMarshalResponse(t *testing.T) {
	t.Parallel()

	w := httptest.NewRecorder()

	toSave := map[string]string{
		"name": "John",
	}

	MarshalResponse(w, http.StatusOK, toSave)

	if w.Code != http.StatusOK {
		t.Errorf("wrong response code, want: %v got: %v", http.StatusOK, w.Code)
	}

	got := w.Body.String()
	want := `{"name":"John"}`
	if diff := cmp.Diff(want, got); diff != "" {
		t.Errorf("unmarshal mismatch (-want +got):\n%v", diff)
	}
}

func TestMarshalResponseError(t *testing.T) {
	t.Parallel()

	w := httptest.NewRecorder()

	type Circular struct {
		Name string    `json:"name"`
		Next *Circular `json:"next"`
	}

	badInput := &Circular{
		Name: "Bob",
	}
	badInput.Next = badInput

	MarshalResponse(w, http.StatusInternalServerError, badInput)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("wrong response code, want: %v got: %v", http.StatusOK, w.Code)
	}

	got := w.Body.String()
	want := `{"error":"json: unsupported value: encountered a cycle via *jsonutil.Circular"}`
	if diff := cmp.Diff(want, got); diff != "" {
		t.Errorf("unmarshal mismatch (-want +got):\n%v", diff)
	}
}

func TestJsonErrTmpl(t *testing.T) {
	t.Parallel()

	errMsg := "this is an error"
	want := `{"error":"this is an error"}`
	got := fmt.Sprintf(jsonErrTmpl, errMsg)

	if diff := cmp.Diff(want, got); diff != "" {
		t.Errorf("json error template mismatch (-want +got):\n%v", diff)
	}
}
