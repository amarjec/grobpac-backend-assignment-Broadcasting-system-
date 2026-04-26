const { Op } = require('sequelize')
const { sequelize, Content, ContentSlot, ContentSchedule, User } = require('../models')

const parseScheduleWindow = ({ start_time, end_time, rotation_duration_minutes }) => {
  const duration = rotation_duration_minutes ? Number(rotation_duration_minutes) : 1

  if (!Number.isInteger(duration) || duration <= 0) {
    return {
      error: {
        statusCode: 400,
        body: { message: 'rotation_duration_minutes must be a positive integer' }
      }
    }
  }

  const parsedStartTime = start_time ? new Date(start_time) : null
  const parsedEndTime = end_time ? new Date(end_time) : null

  if (parsedStartTime && Number.isNaN(parsedStartTime.getTime())) {
    return {
      error: {
        statusCode: 400,
        body: { message: 'Invalid start_time' }
      }
    }
  }

  if (parsedEndTime && Number.isNaN(parsedEndTime.getTime())) {
    return {
      error: {
        statusCode: 400,
        body: { message: 'Invalid end_time' }
      }
    }
  }

  if (parsedStartTime && parsedEndTime && parsedStartTime > parsedEndTime) {
    return {
      error: {
        statusCode: 400,
        body: { message: 'start_time must be earlier than end_time' }
      }
    }
  }

  return {
    duration,
    parsedStartTime,
    parsedEndTime
  }
}

const uploadContent = async ({ body, file, user }) => {
  const { title, subject, description, start_time, end_time, rotation_duration_minutes } = body

  if (!file) {
    return {
      statusCode: 400,
      body: { message: 'File is required' }
    }
  }

  if (!title || !subject) {
    return {
      statusCode: 400,
      body: { message: 'Title and subject are required' }
    }
  }

  const scheduleWindow = parseScheduleWindow({
    start_time,
    end_time,
    rotation_duration_minutes
  })

  if (scheduleWindow.error) {
    return scheduleWindow.error
  }

  const result = await sequelize.transaction(async (transaction) => {
    const content = await Content.create(
      {
        title,
        description: description || null,
        subject,
        file_path: `/uploads/${file.filename}`,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: user.id,
        status: 'pending'
      },
      { transaction }
    )

    const [slot] = await ContentSlot.findOrCreate({
      where: { subject },
      defaults: { subject },
      transaction
    })

    const currentMaxOrder = await ContentSchedule.max('rotation_order', {
      where: { slot_id: slot.id },
      transaction
    })

    const schedule = await ContentSchedule.create(
      {
        content_id: content.id,
        slot_id: slot.id,
        rotation_order: Number.isInteger(currentMaxOrder) ? currentMaxOrder + 1 : 1,
        duration: scheduleWindow.duration,
        start_time: scheduleWindow.parsedStartTime,
        end_time: scheduleWindow.parsedEndTime
      },
      { transaction }
    )

    return { content, slot, schedule }
  })

  return {
    statusCode: 201,
    body: {
      message: 'Content uploaded successfully and is pending approval',
      content: result.content,
      slot: result.slot,
      schedule: result.schedule
    }
  }
}

const getPendingContent = async () => {
  const pendingContent = await Content.findAll({
    where: { status: 'pending' },
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'name', 'email']
      },
      {
        model: ContentSchedule,
        as: 'schedule',
        include: [
          {
            model: ContentSlot,
            as: 'slot',
            attributes: ['id', 'subject']
          }
        ]
      }
    ],
    order: [['created_at', 'ASC']]
  })

  return {
    statusCode: 200,
    body: pendingContent
  }
}

const approveContent = async ({ contentId, principalId }) => {
  const content = await Content.findByPk(contentId)

  if (!content) {
    return {
      statusCode: 404,
      body: { message: 'Content not found' }
    }
  }

  await content.update({
    status: 'approved',
    rejection_reason: null,
    approved_by: principalId,
    approved_at: new Date()
  })

  return {
    statusCode: 200,
    body: {
      message: 'Content approved successfully',
      content
    }
  }
}

const rejectContent = async ({ contentId, principalId, rejectionReason }) => {
  if (!rejectionReason) {
    return {
      statusCode: 400,
      body: { message: 'rejection_reason is required' }
    }
  }

  const content = await Content.findByPk(contentId)

  if (!content) {
    return {
      statusCode: 404,
      body: { message: 'Content not found' }
    }
  }

  await content.update({
    status: 'rejected',
    rejection_reason: rejectionReason,
    approved_by: principalId,
    approved_at: new Date()
  })

  return {
    statusCode: 200,
    body: {
      message: 'Content rejected successfully',
      content
    }
  }
}

const getLiveContent = async ({ teacherId }) => {
  const parsedTeacherId = Number(teacherId)

  if (Number.isNaN(parsedTeacherId)) {
    return {
      statusCode: 400,
      body: { message: 'Invalid teacher_id' }
    }
  }

  const now = new Date()
  const nowEpoch = Date.now()

  const schedules = await ContentSchedule.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { start_time: null },
            { start_time: { [Op.lte]: now } }
          ]
        },
        {
          [Op.or]: [
            { end_time: null },
            { end_time: { [Op.gte]: now } }
          ]
        }
      ]
    },
    include: [
      {
        model: Content,
        as: 'content',
        where: {
          uploaded_by: parsedTeacherId,
          status: 'approved'
        }
      },
      {
        model: ContentSlot,
        as: 'slot'
      }
    ],
    order: [
      [{ model: ContentSlot, as: 'slot' }, 'subject', 'ASC'],
      ['rotation_order', 'ASC'],
      ['id', 'ASC']
    ]
  })

  if (!schedules.length) {
    return {
      statusCode: 200,
      body: { message: 'No content available' }
    }
  }

  const schedulesBySlot = schedules.reduce((accumulator, schedule) => {
    if (!accumulator[schedule.slot_id]) {
      accumulator[schedule.slot_id] = []
    }

    accumulator[schedule.slot_id].push(schedule)
    return accumulator
  }, {})

  const activeContent = Object.values(schedulesBySlot).map((slotSchedules) => {
    const orderedSchedules = slotSchedules.slice().sort((left, right) => {
      if (left.rotation_order !== right.rotation_order) {
        return left.rotation_order - right.rotation_order
      }

      return left.id - right.id
    })

    const cycleDurationMs = orderedSchedules.reduce((total, schedule) => {
      return total + Math.max(schedule.duration, 1) * 60 * 1000
    }, 0)

    const cycleOffset = nowEpoch % cycleDurationMs
    let elapsed = 0
    let activeSchedule = orderedSchedules[0]

    for (const schedule of orderedSchedules) {
      elapsed += Math.max(schedule.duration, 1) * 60 * 1000

      if (cycleOffset < elapsed) {
        activeSchedule = schedule
        break
      }
    }

    return {
      id: activeSchedule.content.id,
      title: activeSchedule.content.title,
      description: activeSchedule.content.description,
      subject: activeSchedule.slot.subject,
      file_path: activeSchedule.content.file_path,
      file_type: activeSchedule.content.file_type,
      file_size: activeSchedule.content.file_size,
      uploaded_by: activeSchedule.content.uploaded_by,
      status: activeSchedule.content.status,
      rejection_reason: activeSchedule.content.rejection_reason,
      approved_by: activeSchedule.content.approved_by,
      approved_at: activeSchedule.content.approved_at,
      created_at: activeSchedule.content.created_at,
      schedule: {
        id: activeSchedule.id,
        slot_id: activeSchedule.slot_id,
        rotation_order: activeSchedule.rotation_order,
        duration: activeSchedule.duration,
        start_time: activeSchedule.start_time,
        end_time: activeSchedule.end_time,
        created_at: activeSchedule.created_at
      }
    }
  })

  return {
    statusCode: 200,
    body: activeContent
  }
}

module.exports = {
  uploadContent,
  getPendingContent,
  approveContent,
  rejectContent,
  getLiveContent
}
