'use client'

import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

const LuckyWheelNew = ({ onSpinComplete, assignedPrize = null, isSpinning = false }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const tickAudioRef = useRef(null)
  const [rotation, setRotation] = useState(0)
  const [isSpinningLocal, setIsSpinningLocal] = useState(false)

  // Fetch prizes from API
  const { data: prizesData, error: prizesError } = useSWR('/api/prizes', fetcher)
  
  // Transform prizes data to include both _id and id for compatibility
  const prizes = prizesData?.prizes 
    ? prizesData.prizes
        .filter(prize => prize.isActive) // Only show active prizes
        .map(prize => ({
          _id: prize._id,
          id: prize._id.toString(), // For compatibility with existing code
          name: prize.name,
          color: prize.color,
          description: prize.description,
          probability: prize.probability
        }))
    : []

  // Redraw wheel whenever rotation or prizes change
  useEffect(() => {
    if (prizes.length > 0) {
      drawWheel()
    }
  }, [rotation, prizes])

  useEffect(() => {
    if (isSpinning && !isSpinningLocal) {
      spin()
    }
  }, [isSpinning])

  // Initialize audio
  useEffect(() => {
    tickAudioRef.current = new Audio('/tick.mp3')
    tickAudioRef.current.volume = 0.9 // Set volume to 30%
    
    return () => {
      // Cleanup
      if (tickAudioRef.current) {
        tickAudioRef.current.pause()
        tickAudioRef.current = null
      }
    }
  }, [])

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas || prizes.length === 0) return
    
    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 25 // Slightly smaller to leave room for border

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw outer border
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 8
    ctx.stroke()
    
    const anglePerPrize = (2 * Math.PI) / prizes.length

    prizes.forEach((prize, index) => {
      const startAngle = index * anglePerPrize + rotation
      const endAngle = startAngle + anglePerPrize

      // Draw segment - extend to border edge
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius + 4, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = prize.color
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + anglePerPrize / 2)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000'
      ctx.font = '18px Poppins'
      ctx.shadowColor = 'rgba(0,0,0,0.2)'
      ctx.shadowBlur = 3
      ctx.fillText(prize.name, radius / 2 + 28, 6) // Move text further out
      ctx.restore()
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 9, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 5
    ctx.stroke()

    // Draw pointer triangle - pointing deeper into the pie
    ctx.beginPath()
    ctx.moveTo(centerX + radius - 15, centerY) // Tip point pointing into the pie
    ctx.lineTo(centerX + radius + 55, centerY - 32) // Bottom right
    ctx.lineTo(centerX + radius + 55, centerY + 32) // Top right
    ctx.closePath()
    ctx.fillStyle = '#FF0000'
    ctx.fill()
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const spin = () => {
    if (isSpinningLocal || prizes.length === 0) return
    
    setIsSpinningLocal(true)
    
    let targetRotation
    let randomIndex // Store random index for consistency
    let finalIndex // Declare in higher scope
    
    if (assignedPrize) {
      // Find prize by _id (MongoDB ObjectId)
      const assignedPrizeId = assignedPrize._id || assignedPrize.id
      const targetIndex = prizes.findIndex(p => 
        p._id?.toString() === assignedPrizeId?.toString() || 
        p.id === assignedPrizeId?.toString()
      )
      
      if (targetIndex === -1) {
        console.error('Assigned prize not found in prizes list:', assignedPrizeId)
        setIsSpinningLocal(false)
        return
      }
      
      finalIndex = targetIndex
      
     
      
      // Calculate angle per prize dynamically
      const anglePerPrize = (2 * Math.PI) / prizes.length
      const anglePerPrizeDegrees = 360 / prizes.length
      
      // We want the target prize to be at the pointer position (right side = 0 degrees)
      // But since prizes are drawn from top, we need to offset by half segment
      const targetDegrees = -targetIndex * anglePerPrizeDegrees - (anglePerPrizeDegrees / 2)
      const targetRadians = targetDegrees * (Math.PI / 180)
      
      // Add 5 full rotations for visual effect
      targetRotation = 5 * 2 * Math.PI + targetRadians
      
     
    } else {
      // Random spin - select prize based on probability
      const spins = 5 + Math.random() * 5
      
      // Calculate total probability
      const totalProbability = prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0)
      
      // Select random prize based on probability
      let random = Math.random() * totalProbability
      let cumulativeProbability = 0
      
      for (let i = 0; i < prizes.length; i++) {
        cumulativeProbability += prizes[i].probability || 0
        if (random <= cumulativeProbability) {
          randomIndex = i
          break
        }
      }
      
      // Fallback to random if no probability set
      if (randomIndex === undefined) {
        randomIndex = Math.floor(Math.random() * prizes.length)
      }
      
      finalIndex = randomIndex
      
      // Calculate angle per prize dynamically
      const anglePerPrizeDegrees = 360 / prizes.length
      const targetDegrees = -randomIndex * anglePerPrizeDegrees - (anglePerPrizeDegrees / 2)
      const targetRadians = targetDegrees * (Math.PI / 180)
      targetRotation = spins * Math.PI * 2 + targetRadians
      
     
    }

    const duration = 4000 // 4 seconds
    const startTime = Date.now()
    const startRotation = rotation
    let lastRotation = startRotation
    let lastTickTime = Date.now()
    const minTickInterval = 30 // Minimum time between ticks (ms)
    const maxTickInterval = 200 // Maximum time between ticks (ms)

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const newRotation = startRotation + (targetRotation - startRotation) * easeOut
      setRotation(newRotation)
      
      // Play tick sound based on rotation change and progress
      const rotationDelta = Math.abs(newRotation - lastRotation)
      const timeSinceLastTick = now - lastTickTime
      
      // Calculate dynamic tick interval based on progress (faster at start, slower at end)
      const dynamicTickInterval = minTickInterval + (maxTickInterval - minTickInterval) * progress
      
      if (rotationDelta > 0.1 && timeSinceLastTick >= dynamicTickInterval && tickAudioRef.current) {
        try {
          tickAudioRef.current.currentTime = 0 // Reset to start for quick replay
          tickAudioRef.current.play().catch(() => {
            // Ignore audio play errors (user interaction required)
          })
        } catch (err) {
          // Ignore errors
        }
        lastTickTime = now
      }
      
      lastRotation = newRotation
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Stop tick sound
        if (tickAudioRef.current) {
          tickAudioRef.current.pause()
          tickAudioRef.current.currentTime = 0
        }
        
        // Wait a moment before showing result for better UX
        setTimeout(() => {
          setIsSpinningLocal(false)
          
          let wonPrize
          if (assignedPrize) {
            // Use assigned prize, but ensure it has the correct format
            wonPrize = {
              _id: assignedPrize._id || assignedPrize.id,
              id: assignedPrize._id?.toString() || assignedPrize.id,
              name: assignedPrize.name,
              color: assignedPrize.color,
              description: assignedPrize.description
            }
          } else {
            // Use FINAL INDEX untuk memastikan tidak berubah
            wonPrize = prizes[finalIndex]
         
          }
          // Trigger confetti
          confetti({
            particleCount: 500,
            spread: 90,
            origin: { y: 0.6 }
          })
          
          onSpinComplete(wonPrize)
        }, 1000) // 1 second delay before showing result
      }
    }

    animate()
  }

  if (prizesError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-600">Error loading prizes: {prizesError.message}</div>
      </div>
    )
  }

  if (prizes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-gray-600">Loading prizes...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          className=" rounded-full bg-gradient-to-r from-purple-400 via-teal-400 to-pink-600 shadow-2xl shadow-black/40"
        />
      </div>
    </div>
  )
}

export default LuckyWheelNew