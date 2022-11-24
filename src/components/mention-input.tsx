import React, { FC, MutableRefObject, useMemo, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from "react-native";

import { MentionInputProps, MentionPartType, Part, Suggestion } from "../types";
import {
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  getMentionPartSuggestionKeywords,
  isMentionPartType,
  parseValue,
} from "../utils";

const MentionInput: FC<MentionInputProps> = ({
  textInput,
  value,
  onChange,
  selection,
  setSelection,
  partTypes = [],

  inputRef: propInputRef,

  containerStyle,

  onSelectionChange,

  ...textInputProps
}) => {
  // const [selection, setSelection] = useState(selection);

  const { plainText, parts } = useMemo(
    () => parseValue(value, partTypes),
    [value, partTypes]
  );

  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    console.log("handleSelectionChange: ", event.nativeEvent.selection);
    // setSelection(event.nativeEvent.selection);

    onSelectionChange && onSelectionChange(event);
  };

  /**
   * Callback that trigger on TextInput text change
   *
   * @param changedText
   */
  const onChangeInput = (
    changedText: string,
    parts: Part[],
    selection: {
      start: number;
      end: number;
    }
  ) => {
    onChange(
      generateValueFromPartsAndChangedText(parts, plainText, changedText),
      parts
    );
  };

  /**
   * We memoize the keyword to know should we show mention suggestions or not
   */
  const keywordByTrigger = useMemo(() => {
    return getMentionPartSuggestionKeywords(
      parts,
      plainText,
      selection,
      partTypes
    );
  }, [parts, plainText, selection, partTypes]);

  /**
   * Callback on mention suggestion press. We should:
   * - Get updated value
   * - Trigger onChange callback with new value
   */
  const onSuggestionPress =
    (mentionType: MentionPartType) => (suggestion: Suggestion) => {
      const newValue = generateValueWithAddedSuggestion(
        parts,
        mentionType,
        plainText,
        selection,
        suggestion
      );

      if (!newValue) {
        return;
      }

      onChange(newValue, parts);

      /**
       * Move cursor to the end of just added mention starting from trigger string and including:
       * - Length of trigger string
       * - Length of mention name
       * - Length of space after mention (1)
       *
       * Not working now due to the RN bug
       */
      // const newCursorPosition = currentPart.position.start + triggerPartIndex + trigger.length +
      // suggestion.name.length + 1;

      // textInput.current?.setNativeProps({selection: {start: newCursorPosition, end: newCursorPosition}});
    };

  const handleTextInputRef = (ref: TextInput) => {
    textInput.current = ref as TextInput;

    if (propInputRef) {
      if (typeof propInputRef === "function") {
        propInputRef(ref);
      } else {
        (propInputRef as MutableRefObject<TextInput>).current =
          ref as TextInput;
      }
    }
  };

  const renderMentionSuggestions = (mentionType: MentionPartType) => (
    <React.Fragment key={mentionType.trigger}>
      {mentionType.renderSuggestions &&
        mentionType.renderSuggestions({
          keyword: keywordByTrigger[mentionType.trigger],
          onSuggestionPress: onSuggestionPress(mentionType),
        })}
    </React.Fragment>
  );

  const convertHashTag = (initialText: string) => {
    return (
      <Text key={123} style={{ fontSize: 14, fontWeight: "400" }}>
        {initialText?.length > 0 &&
          initialText.split(" ").map((t, index) => textItem(t, index))}
      </Text>
    );
  };

  const textItem = (t: string, index: number) => {
    if (t.includes("$")) {
      return (
        <Text
          key={`${index}-stock`}
          style={{ color: "blue", fontSize: 14, fontWeight: "400" }}
        >{`${t.replace("$", "")} `}</Text>
      );
    } else if (t.includes("%")) {
      return (
        <Text
          key={`${index}-user`}
          style={{ color: "green", fontSize: 14, fontWeight: "400" }}
        >{`${t.replace("%", "")} `}</Text>
      );
    } else {
      return (
        <Text key={`${index}-default`} style={{ color: "white" }}>
          {t}
        </Text>
      );
    }
  };

  return (
    <View style={containerStyle}>
      {(
        partTypes.filter(
          (one) =>
            isMentionPartType(one) &&
            one.renderSuggestions != null &&
            !one.isBottomMentionSuggestionsRender
        ) as MentionPartType[]
      ).map(renderMentionSuggestions)}

      <TextInput
        multiline
        {...textInputProps}
        // selection={handleTextInputRef}
        ref={handleTextInputRef}
        onChangeText={(text) => {
          onChangeInput(text, parts, selection);
        }}
        onSelectionChange={handleSelectionChange}
      >
        <Text>
          {parts.map(({ text, partType, data }, index) =>
            partType ? (
              <Text
                key={`${index}-${data?.trigger ?? "pattern"}`}
                style={partType.textStyle ?? defaultMentionTextStyle}
              >
                {text}
              </Text>
            ) : (
              <Text key={index}>{text}</Text>
            )
          )}
        </Text>
      </TextInput>

      {(
        partTypes.filter(
          (one) =>
            isMentionPartType(one) &&
            one.renderSuggestions != null &&
            one.isBottomMentionSuggestionsRender
        ) as MentionPartType[]
      ).map(renderMentionSuggestions)}
    </View>
  );
};

export { MentionInput };
