import Todo from "../schemas/todo.schema.js";
import Joi from "joi";
import express from "express";

// 할 일 생성 API의 요청 데이터 검증을 위한 Joi 스키마를 정의합니다.
const createTodoSchema = Joi.object({
  value: Joi.string().min(1).max(50).required(),
});

const router = express.Router();

/** 에러 핸들러 **/
router.post("/todos", async (req, res, next) => {
  try {
    // 클라이언트에게 전달받은 데이터를 검증합니다.
    const validateBody = await createTodoSchema.validateAsync(req.body);

    // 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
    const { value } = validateBody;

    // Todo모델을 사용해, MongoDB에서 'order' 값이 가장 높은 '해야할 일'을 찾습니다.
    const todoMaxOrder = await Todo.findOne().sort("-order").exec();

    // 'order' 값이 가장 높은 도큐멘트의 1을 추가하거나 없다면, 1을 할당합니다.
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // Todo모델을 이용해, 새로운 '해야할 일'을 생성합니다.
    const todo = new Todo({ value, order });

    // 생성한 '해야할 일'을 MongoDB에 저장합니다.
    await todo.save();

    return res.status(201).json({ todo });
  } catch (error) {
    // 발생한 에러를 다음 에러 처리 미들웨어로 전달합니다.
    next(error);
  }
});

router.get("/todos", async (req, res) => {
  // Todo모델을 이용해, MongoDB에서 'order' 값이 가장 높은 '해야할 일'을 찾습니다.
  const todos = await Todo.find().sort("-order").exec();

  // 찾은 '해야할 일'을 클라이언트에게 전달합니다.
  return res.status(200).json({ todos });
});

// routes/todos.router.js

router.patch("/todos/:todoId", async (req, res) => {
  // 변경할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;
  // '해야할 일'을 몇번째 순서로 설정할 지 order 값을 가져옵니다.
  const { order } = req.body;

  // 변경하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 todo 데이터입니다." });
  }

  if (order) {
    // 변경하려는 order 값을 가지고 있는 '해야할 일'을 찾습니다.
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      // 만약, 이미 해당 order 값을 가진 '해야할 일'이 있다면, 해당 '해야할 일'의 order 값을 변경하고 저장합니다.
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    // 변경하려는 '해야할 일'의 order 값을 변경합니니다.
    currentTodo.order = order;
  }

  // 변경된 '해야할 일'을 저장합니다.
  await currentTodo.save();

  return res.status(200).json({});
});

// /routes/todos.router.js

/** 순서 변경, 할 일 완료/해제 **/
router.patch("/todos/:todoId", async (req, res) => {
  // 변경할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;
  // '해야할 일'을 몇번째 순서로 설정할 지 order 값을 가져옵니다.
  const { order, done } = req.body;

  // 변경하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 todo 데이터입니다." });
  }

  if (order) {
    // 변경하려는 order 값을 가지고 있는 '해야할 일'을 찾습니다.
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      // 만약, 이미 해당 order 값을 가진 '해야할 일'이 있다면, 해당 '해야할 일'의 order 값을 변경하고 저장합니다.
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    // 변경하려는 '해야할 일'의 order 값을 변경합니니다.
    currentTodo.order = order;
  }
  if (done !== undefined) {
    // 변경하려는 '해야할 일'의 doneAt 값을 변경합니다.
    currentTodo.doneAt = done ? new Date() : null;
  }

  // 변경된 '해야할 일'을 저장합니다.
  await currentTodo.save();

  return res.status(200).json({});
});

// routes/todos.router.js

/** 할 일 삭제 **/
router.delete("/todos/:todoId", async (req, res) => {
  // 삭제할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;

  // 삭제하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 todo 데이터입니다." });
  }

  // 조회된 '해야할 일'을 삭제합니다.
  await Todo.deleteOne({ _id: todoId }).exec();

  return res.status(200).json({});
});

// /routes/todos.router.js

/** 순서 변경, 할 일 완료/해제, 할 일 내용 변경 **/
router.patch("/todos/:todoId", async (req, res) => {
  // 변경할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;
  // 클라이언트가 전달한 순서, 완료 여부, 내용 데이터를 가져옵니다.
  const { order, done, value } = req.body;

  // 변경하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 todo 데이터입니다." });
  }

  if (order) {
    // 변경하려는 order 값을 가지고 있는 '해야할 일'을 찾습니다.
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      // 만약, 이미 해당 order 값을 가진 '해야할 일'이 있다면, 해당 '해야할 일'의 order 값을 변경하고 저장합니다.
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    // 변경하려는 '해야할 일'의 order 값을 변경합니니다.
    currentTodo.order = order;
  }
  if (done !== undefined) {
    // 변경하려는 '해야할 일'의 doneAt 값을 변경합니다.
    currentTodo.doneAt = done ? new Date() : null;
  }
  if (value) {
    // 변경하려는 '해야할 일'의 내용을 변경합니다.
    currentTodo.value = value;
  }

  // 변경된 '해야할 일'을 저장합니다.
  await currentTodo.save();

  return res.status(200).json({});
});

export default router;

// import Joi from 'joi';

// // Joi 스키마를 정의합니다.
// const schema = Joi.object({
//   // name Key는 문자열 타입이고, 필수로 존재해야합니다.
//   // 문자열은 최소 3글자, 최대 30글자로 정의합니다.
//   name: Joi.string().min(3).max(30).required(),
// });

// // 검증할 데이터를 정의합니다.
// const user = { name: 'Foo Bar' };

// // schema를 이용해 user 데이터를 검증합니다.
// const validation = schema.validate(user);

// // 검증 결과값 중 error가 존재한다면 에러 메시지를 출력합니다.
// if (validation.error) {
//   console.log(validation.error.message);
// } else {
//   // 검증 결과값 중 error가 존재하지 않는다면, 데이터가 유효하다는 메시지를 출력합니다.
//   console.log('Valid Data!');
// }

// import Joi from 'joi';

// // Joi 스키마를 정의합니다.
// const schema = Joi.object({
//   // name Key는 문자열 타입이고, 필수로 존재해야합니다.
//   // 문자열은 이메일 형식에 맞아야합니다.
//   email: Joi.string().email().required(),
// });

// // 검증할 데이터를 정의합니다.
// const user = { email: 'foo@example.com' };

// // schema를 이용해 user 데이터를 검증합니다.
// const validation = schema.validate(user);

// // 검증 결과값 중 error가 존재한다면 에러 메시지를 출력합니다.
// if (validation.error) {
//   console.log(validation.error.message);
// } else {
//   // 검증 결과값 중 error가 존재하지 않는다면, 데이터가 유효하다는 메시지를 출력합니다.
//   console.log('Valid Email User!');
// }

// import Joi from 'joi';

// // Joi 스키마를 정의합니다.
// const schema = Joi.object({
//   // name Key는 문자열 타입이고, 필수로 존재해야합니다.
//   // 문자열은 최소 3글자, 최대 30글자로 정의합니다.
//   name: Joi.string().min(3).max(30).required(),
// });

// // 검증할 데이터를 정의합니다.
// const user = { name: 'Foo Bar' };

// try {
//   // schema를 이용해 user 데이터를 검증합니다.
//   const validation = await schema.validateAsync(user);
//   // 검증 결과값 중 error가 존재하지 않는다면, 데이터가 유효하다는 메시지를 출력합니다.
//   console.log('Valid Data!');
// } catch (error) {
//   // 검증에 실패한다면, 에러 메시지를 출력합니다.
//   console.log(error.message);
// }
