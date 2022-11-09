/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// @ts-nocheck
// eslint-disable-next-line import/no-extraneous-dependencies
import visit from "unist-util-visit"
// eslint-disable-next-line import/no-extraneous-dependencies
import is from "unist-util-is"

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function remarkColoredText() {
  this.currentColor = null

  const sentenceWithColorRegex = new RegExp(
    "\\[\\w+](([^[])*(\\w+)*([\\n\\r\\s]+\\w+)*)\\[\\/\\w+\\b]"
  )
  const colorStartRegex = new RegExp("\\[\\w+]")
  const colorEndRegex = new RegExp("\\[\\/\\w+]")

  return (tree, file) => {
    visit(tree, "paragraph", node => {
      node.children.forEach((child, index) => {
        if (is(child, "text") === true) {
          let text = child.value
          let match = text.match(sentenceWithColorRegex)
          while (match && match.index !== undefined) {
            const prefix = text.substring(0, match.index)
            if (prefix.length > 0) {
              text = text.substring(match.index)
            }
            match = text.match(sentenceWithColorRegex)
            if (match) {
              const colorMatch = match[0].match(colorStartRegex)
              if (colorMatch) {
                text = text.substring(match[0].length)
              }
            }
          }
          const colorStartMatch = text.match(colorStartRegex)
          const colorEndMatch = text.match(colorEndRegex)
          if (colorStartMatch && !colorEndMatch && !this.currentColor) {
            const prefix = text.substring(0, colorStartMatch.index)
            if (prefix.length > 0) {
              text = text.substring(colorStartMatch.index)
            }
            this.currentColor = colorStartMatch[0]
              .replace("[", "")
              .replace("]", "")
            child.value = child.value.replace(
              text,
              `${text}[/${this.currentColor}]`
            )
          } else if (colorEndMatch && !colorStartMatch) {
            const suffix = text.substring(colorEndMatch.index, text.length)
            if (suffix.length > 0) {
              text = text.substring(0, colorEndMatch.index)
            }
            this.currentColor = colorEndMatch[0].substring(
              2,
              colorEndMatch[0].length - 1
            )
            child.value = child.value.replace(
              text,
              `[${this.currentColor}]${text}`
            )
            this.currentColor = null
          } else if (
            this.currentColor &&
            !child.value.match(sentenceWithColorRegex)
          ) {
            child.value = `[${this.currentColor}]${child.value}[/${this.currentColor}]`
          }
        }
      })
    })
  }
}
