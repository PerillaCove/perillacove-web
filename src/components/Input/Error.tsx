import React from "react";

interface Props {
  text: string;
}

const InputError: React.FC<Props> = (props) => {
  return (
    <p className="text-red-600 dark:text-red-300 text-xs italic">
      {props.text}
    </p>
  );
};

export default InputError;
