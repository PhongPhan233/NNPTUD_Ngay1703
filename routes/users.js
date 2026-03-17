var express = require("express");
var router = express.Router();
let { CreateUserValidator, validationResult } = require('../utils/validatorHandler')
let userModel = require("../schemas/users");
let userController = require('../controllers/users')
let {CheckLogin} = require('../utils/authHandler')


router.get("/",CheckLogin, async function (req, res, next) {
    let users = await userModel
      .find({ isDeleted: false })
      .populate({
        path: 'role',
        select: 'name'
      })
    res.send(users);
  });

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validationResult, async function (req, res, next) {
  try {
    let newItem = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email, req.body.role
    )
    res.send(newItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await
      userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
router.post('/changepassword', CheckLogin, async function(req,res){

    try{

        let {oldpassword, newpassword} = req.body

        if(!oldpassword || !newpassword){
            res.status(400).send("thieu du lieu")
            return
        }

        if(newpassword.length < 6){
            res.status(400).send("password phai >= 6 ky tu")
            return
        }

        let user = req.user

        let check = await userController.CompareLogin(user, oldpassword)

        if(!check){
            res.status(403).send("old password sai")
            return
        }

        user.password = newpassword
        await user.save()

        res.send("doi password thanh cong")

    }catch(err){
        res.status(400).send(err.message)
    }

})
router.post("/changepassword", CheckLogin, async function (req, res) {

  try {

    let { oldpassword, newpassword } = req.body;

    // kiểm tra dữ liệu
    if (!oldpassword || !newpassword) {
      return res.status(400).send("missing oldpassword or newpassword");
    }

    // validate new password
    if (newpassword.length < 6) {
      return res.status(400).send("newpassword must be at least 6 characters");
    }

    // user đã login từ middleware
    let user = req.user;

    // kiểm tra old password
    let check = await userController.CompareLogin(user, oldpassword);

    if (!check) {
      return res.status(403).send("oldpassword incorrect");
    }

    // đổi password
    user.password = newpassword;
    await user.save();

    res.send("change password success");

  } catch (err) {
    res.status(400).send(err.message);
  }

});
module.exports = router;