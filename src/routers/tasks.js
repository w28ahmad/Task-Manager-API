const express = require('express')
const Task = require('../models/tasks')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async(req, res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

// GET /tasks?completed=true
// limit and skip, /tasks?limit=10?skip=10
router.get('/tasks', auth, async(req, res)=>{
    const match = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    
    try{
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip)
            }
        }).execPopulate() 
        tasks = req.user.tasks
        res.send(tasks)
    }catch(e){
        res.status(500).send()
    }

})


router.get('/tasks/:id', auth, async(req, res)=>{
    const _id = req.params.id

    try{
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.send(500).send()
    }
})

router.patch("/tasks/:id", auth, async(req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ["completed", "discription"]

    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error:"Invalid Updates"})
    }
    
    try{
        const task = await Task.findOne({_id:req.params.id, owner:req.user._id})

        // This line does not take into account the middle ware for hashing the passwords
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators:true})

        if(!task){
            return res.status(400).send()
        }

        updates.forEach((update)=>task[update] = req.body[update])
        await task.save()

        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete("/tasks/:id", auth, async(req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        
        if(!task){
            return res.status(400).send()
        }
        res.send(task)

    }catch(e){
        res.status(500).send()
    }
})


module.exports = router