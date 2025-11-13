import { useState, useRef, useEffect } from 'react'
import './App.css'
import falconLogo from './assets/falcon-logo.jpeg'

function App() {
  // Carregar dados do localStorage ou usar valores padrão
  const loadPlayersFromStorage = () => {
    try {
      const savedPlayers = localStorage.getItem('falcon-volei-players')
      if (savedPlayers) {
        return JSON.parse(savedPlayers)
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores do localStorage:', error)
    }
    // Valores padrão alinhados com as posições indicativas da quadra
    return [
      { id: 1, name: 'Jogador 1', number: 1, position: { x: '83.33%', y: '19.44%' } },  // Posição 2
      { id: 2, name: 'Jogador 2', number: 2, position: { x: '50%', y: '19.44%' } },     // Posição 3
      { id: 3, name: 'Jogador 3', number: 3, position: { x: '16.67%', y: '19.44%' } },  // Posição 4
      { id: 4, name: 'Jogador 4', number: 4, position: { x: '83.33%', y: '69.44%' } },  // Posição 1
      { id: 5, name: 'Jogador 5', number: 5, position: { x: '50%', y: '69.44%' } },     // Posição 6
      { id: 6, name: 'Jogador 6', number: 6, position: { x: '16.67%', y: '69.44%' } }   // Posição 5
    ]
  }

  const loadRotationsFromStorage = () => {
    try {
      const savedRotations = localStorage.getItem('falcon-volei-rotations')
      if (savedRotations) {
        return JSON.parse(savedRotations)
      }
    } catch (error) {
      console.error('Erro ao carregar rotações do localStorage:', error)
    }
    return []
  }

  const [players, setPlayers] = useState(loadPlayersFromStorage)
  
  const [savedRotations, setSavedRotations] = useState(loadRotationsFromStorage)
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editingNumber, setEditingNumber] = useState(null)
  const [editingRotation, setEditingRotation] = useState(null)
  const [tempName, setTempName] = useState('')
  const [tempNumber, setTempNumber] = useState('')
  const [tempRotationName, setTempRotationName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')
  const [selectedRotationName, setSelectedRotationName] = useState('')
  const [touchTimeout, setTouchTimeout] = useState(null)
  const [touchStartTime, setTouchStartTime] = useState(null)
  const [longPressTimeout, setLongPressTimeout] = useState(null)
  const courtRef = useRef(null)

  // useEffect para salvar jogadores automaticamente no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('falcon-volei-players', JSON.stringify(players))
    } catch (error) {
      console.error('Erro ao salvar jogadores no localStorage:', error)
    }
  }, [players])

  // useEffect para salvar rotações automaticamente no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('falcon-volei-rotations', JSON.stringify(savedRotations))
    } catch (error) {
      console.error('Erro ao salvar rotações no localStorage:', error)
    }
  }, [savedRotations])

  // useEffect para limpeza da modal quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (modalImageUrl) {
        URL.revokeObjectURL(modalImageUrl)
      }
    }
  }, [modalImageUrl])

  const handlePlayerNameChange = (id, newName) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, name: newName } : player
    ))
  }

  const handlePlayerNumberChange = (id, newNumber) => {
    const num = parseInt(newNumber)
    if (num >= 1 && num <= 99) {
      setPlayers(players.map(player => 
        player.id === id ? { ...player, number: num } : player
      ))
    }
  }

  const startEditingName = (player, e) => {
    e.stopPropagation()
    setEditingPlayer(player.id)
    setTempName(player.name)
  }

  const finishEditingName = (playerId) => {
    if (tempName.trim()) {
      handlePlayerNameChange(playerId, tempName.trim())
    }
    setEditingPlayer(null)
    setTempName('')
  }

  const handleNameKeyPress = (e, playerId) => {
    if (e.key === 'Enter') {
      finishEditingName(playerId)
    } else if (e.key === 'Escape') {
      setEditingPlayer(null)
      setTempName('')
    }
  }

  const startEditingNumber = (player, e) => {
    e.stopPropagation()
    setEditingNumber(player.id)
    setTempNumber(player.number.toString())
  }

  const finishEditingNumber = (playerId) => {
    const num = parseInt(tempNumber)
    if (num >= 1 && num <= 99) {
      handlePlayerNumberChange(playerId, tempNumber)
    }
    setEditingNumber(null)
    setTempNumber('')
  }

  const handleNumberKeyPress = (e, playerId) => {
    if (e.key === 'Enter') {
      finishEditingNumber(playerId)
    } else if (e.key === 'Escape') {
      setEditingNumber(null)
      setTempNumber('')
    }
  }

  const rotatePositions = () => {
    const rotatedPlayers = [...players]
    
    // Definir as posições exatas das posições indicativas da quadra
    const positions = {
      1: { x: 83.33, y: 69.44 },  // Posição 1 (direita fundo)
      2: { x: 83.33, y: 19.44 },  // Posição 2 (direita frente)  
      3: { x: 50, y: 19.44 },     // Posição 3 (meio frente)
      4: { x: 16.67, y: 19.44 },  // Posição 4 (esquerda frente)
      5: { x: 16.67, y: 69.44 },  // Posição 5 (esquerda fundo)
      6: { x: 50, y: 69.44 }      // Posição 6 (meio fundo)
    }
    
    // Função para calcular distância entre dois pontos
    const calculateDistance = (pos1, pos2) => {
      const dx = pos1.x - pos2.x
      const dy = pos1.y - pos2.y
      return Math.sqrt(dx * dx + dy * dy)
    }
    
    // Encontrar a posição mais próxima de cada jogador
    const playersByPosition = {}
    
    rotatedPlayers.forEach((player, playerIndex) => {
      const playerPos = {
        x: parseFloat(player.position.x),
        y: parseFloat(player.position.y)
      }
      
      let closestPosition = null
      let minDistance = Infinity
      
      // Encontrar a posição mais próxima
      Object.keys(positions).forEach(posNum => {
        const distance = calculateDistance(playerPos, positions[posNum])
        if (distance < minDistance) {
          minDistance = distance
          closestPosition = posNum
        }
      })
      
      // Verificar se a posição já está ocupada por outro jogador mais próximo
      if (!playersByPosition[closestPosition] || 
          calculateDistance(playerPos, positions[closestPosition]) < 
          calculateDistance(
            {
              x: parseFloat(rotatedPlayers[playersByPosition[closestPosition]].position.x),
              y: parseFloat(rotatedPlayers[playersByPosition[closestPosition]].position.y)
            }, 
            positions[closestPosition]
          )) {
        playersByPosition[closestPosition] = playerIndex
      }
    })
    
    // Sistema 6x0 - Rotação no sentido horário: 1→6→5→4→3→2→1
    const rotationMap = { 1: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }
    
    // Aplicar rotação: cada jogador vai para a próxima posição no sentido horário
    Object.keys(playersByPosition).forEach(currentPos => {
      const playerIndex = playersByPosition[currentPos]
      const nextPos = rotationMap[parseInt(currentPos)]
      rotatedPlayers[playerIndex].position = { 
        x: `${positions[nextPos].x}%`, 
        y: `${positions[nextPos].y}%` 
      }
    })
    
    setPlayers(rotatedPlayers)
  }

  const handleMouseDown = (e, player) => {
    const rect = courtRef.current.getBoundingClientRect()
    const playerX = (parseFloat(player.position.x) / 100) * rect.width
    const playerY = (parseFloat(player.position.y) / 100) * rect.height
    
    const offsetX = e.clientX - rect.left - playerX
    const offsetY = e.clientY - rect.top - playerY
    
    setDraggedPlayer(player.id)
    setDragOffset({ x: offsetX, y: offsetY })
  }

  const handleMouseMove = (e) => {
    if (draggedPlayer) {
      const rect = courtRef.current.getBoundingClientRect()
      const courtWidth = rect.width
      const courtHeight = rect.height
      
      const newX = e.clientX - rect.left - dragOffset.x
      const newY = e.clientY - rect.top - dragOffset.y
      
      // Converter para percentuais e limitar movimento
      const percentX = Math.max(5, Math.min((newX / courtWidth) * 100, 95))
      const percentY = Math.max(5, Math.min((newY / courtHeight) * 100, 95))
      
      setPlayers(players.map(player => 
        player.id === draggedPlayer 
          ? { ...player, position: { x: `${percentX}%`, y: `${percentY}%` } }
          : player
      ))
    }
  }

  const handleMouseUp = () => {
    setDraggedPlayer(null)
    setDragOffset({ x: 0, y: 0 })
  }

  // Handlers de touch para mobile - versão melhorada
  const handleTouchStart = (e, player) => {
    // Não prevenir default aqui para permitir outros eventos
    const rect = courtRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const playerX = (parseFloat(player.position.x) / 100) * rect.width
    const playerY = (parseFloat(player.position.y) / 100) * rect.height
    
    const offsetX = touch.clientX - rect.left - playerX
    const offsetY = touch.clientY - rect.top - playerY
    
    // Armazenar posição inicial para detectar movimento
    setTouchStartTime(Date.now())
    
    // Definir timeout para iniciar drag após um pequeno atraso
    const dragTimeout = setTimeout(() => {
      setDraggedPlayer(player.id)
      setDragOffset({ x: offsetX, y: offsetY })
    }, 100) // 100ms de atraso para iniciar drag
    
    setTouchTimeout(dragTimeout)
  }

  const handleTouchMove = (e) => {
    if (draggedPlayer) {
      e.preventDefault() // Só previne default quando já está arrastando
      const rect = courtRef.current.getBoundingClientRect()
      const courtWidth = rect.width
      const courtHeight = rect.height
      
      const touch = e.touches[0]
      const newX = touch.clientX - rect.left - dragOffset.x
      const newY = touch.clientY - rect.top - dragOffset.y
      
      // Converter para percentuais e limitar movimento
      const percentX = Math.max(5, Math.min((newX / courtWidth) * 100, 95))
      const percentY = Math.max(5, Math.min((newY / courtHeight) * 100, 95))
      
      setPlayers(players.map(player => 
        player.id === draggedPlayer 
          ? { ...player, position: { x: `${percentX}%`, y: `${percentY}%` } }
          : player
      ))
    }
  }

  const handleTouchEnd = (e) => {
    // Limpar timeout de drag se existir
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      setTouchTimeout(null)
    }
    
    // Se estava arrastando, parar o drag
    if (draggedPlayer) {
      e.preventDefault()
      setDraggedPlayer(null)
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Funções para long press no mobile - versão melhorada
  const handleLongPressStart = (callback, e) => {
    // Só parar propagação se for elemento específico para edição
    e.stopPropagation()
    
    setTouchStartTime(Date.now())
    const timeout = setTimeout(() => {
      // Cancelar drag se long press for detectado
      if (touchTimeout) {
        clearTimeout(touchTimeout)
        setTouchTimeout(null)
      }
      callback()
    }, 500) // 500ms para long press
    
    setLongPressTimeout(timeout)
  }

  const handleLongPressEnd = (e) => {
    // Só parar propagação se foi para edição
    if (longPressTimeout) {
      e.stopPropagation()
    }
    
    if (longPressTimeout) {
      clearTimeout(longPressTimeout)
      setLongPressTimeout(null)
    }
    
    // Se foi um toque rápido (menos de 200ms), não fazer nada especial
    const touchDuration = Date.now() - (touchStartTime || 0)
    if (touchDuration < 200) {
      setTouchStartTime(null)
    }
  }

  const saveRotation = () => {
    const currentRotation = {
      id: Date.now(),
      name: `Rotação ${savedRotations.length + 1}`,
      players: JSON.parse(JSON.stringify(players))
    }
    setSavedRotations([...savedRotations, currentRotation])
  }

  const loadRotation = (rotation) => {
    setPlayers(rotation.players)
  }

  const deleteRotation = (id) => {
    setSavedRotations(savedRotations.filter(rotation => rotation.id !== id))
  }

  const startEditingRotationName = (rotation, e) => {
    e.stopPropagation()
    setEditingRotation(rotation.id)
    setTempRotationName(rotation.name)
  }

  const finishEditingRotationName = (rotationId) => {
    if (tempRotationName.trim()) {
      setSavedRotations(savedRotations.map(rotation => 
        rotation.id === rotationId ? { ...rotation, name: tempRotationName.trim() } : rotation
      ))
    }
    setEditingRotation(null)
    setTempRotationName('')
  }

  const handleRotationNameKeyPress = (e, rotationId) => {
    if (e.key === 'Enter') {
      finishEditingRotationName(rotationId)
    } else if (e.key === 'Escape') {
      setEditingRotation(null)
      setTempRotationName('')
    }
  }

  const viewRotation = (rotation) => {
    // Gerar imagem das 6 rotações baseada na rotação selecionada
    const allRotations = []
    let currentPlayers = [...rotation.players]
    
    // Adicionar rotação atual como primeira
    allRotations.push({
      name: 'Rotação 1',
      players: JSON.parse(JSON.stringify(currentPlayers))
    })
    
    // Gerar as outras 5 rotações
    for (let i = 1; i < 6; i++) {
      // Aplicar uma rotação no sentido horário usando o mesmo sistema
      const rotatedPlayers = [...currentPlayers]
      
      // Definir as posições exatas das posições indicativas da quadra
      const positions = {
        1: { x: 83.33, y: 69.44 },  // Posição 1 (direita fundo)
        2: { x: 83.33, y: 19.44 },  // Posição 2 (direita frente)  
        3: { x: 50, y: 19.44 },     // Posição 3 (meio frente)
        4: { x: 16.67, y: 19.44 },  // Posição 4 (esquerda frente)
        5: { x: 16.67, y: 69.44 },  // Posição 5 (esquerda fundo)
        6: { x: 50, y: 69.44 }      // Posição 6 (meio fundo)
      }
      
      // Função para calcular distância entre dois pontos
      const calculateDistance = (pos1, pos2) => {
        const dx = pos1.x - pos2.x
        const dy = pos1.y - pos2.y
        return Math.sqrt(dx * dx + dy * dy)
      }
      
      // Encontrar a posição mais próxima de cada jogador
      const playersByPosition = {}
      
      rotatedPlayers.forEach((player, playerIndex) => {
        const playerPos = {
          x: parseFloat(player.position.x),
          y: parseFloat(player.position.y)
        }
        
        let closestPosition = null
        let minDistance = Infinity
        
        // Encontrar a posição mais próxima
        Object.keys(positions).forEach(posNum => {
          const distance = calculateDistance(playerPos, positions[posNum])
          if (distance < minDistance) {
            minDistance = distance
            closestPosition = posNum
          }
        })
        
        // Verificar se a posição já está ocupada por outro jogador mais próximo
        if (!playersByPosition[closestPosition] || 
            calculateDistance(playerPos, positions[closestPosition]) < 
            calculateDistance(
              {
                x: parseFloat(rotatedPlayers[playersByPosition[closestPosition]].position.x),
                y: parseFloat(rotatedPlayers[playersByPosition[closestPosition]].position.y)
              }, 
              positions[closestPosition]
            )) {
          playersByPosition[closestPosition] = playerIndex
        }
      })
      
      // Sistema 6x0 - Rotação no sentido horário: 1→6→5→4→3→2→1
      const rotationMap = { 1: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }
      
      // Aplicar rotação: cada jogador vai para a próxima posição no sentido horário
      Object.keys(playersByPosition).forEach(currentPos => {
        const playerIndex = playersByPosition[currentPos]
        const nextPos = rotationMap[parseInt(currentPos)]
        rotatedPlayers[playerIndex].position = { 
          x: `${positions[nextPos].x}%`, 
          y: `${positions[nextPos].y}%` 
        }
      })
      
      currentPlayers = rotatedPlayers
      allRotations.push({
        name: `Rotação ${i + 1}`,
        players: JSON.parse(JSON.stringify(currentPlayers))
      })
    }
    
    // Criar canvas para desenhar as rotações
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Configurar tamanho do canvas (2 colunas x 3 linhas)
    const courtWidth = 270
    const courtHeight = 180
    const margin = 20
    canvas.width = (courtWidth + margin) * 2 + margin
    canvas.height = (courtHeight + margin) * 3 + margin
    
    // Fundo branco
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Desenhar cada rotação
    allRotations.forEach((rot, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = margin + col * (courtWidth + margin)
      const y = margin + row * (courtHeight + margin)
      
      // Desenhar quadra
      drawCourt(ctx, x, y, courtWidth, courtHeight)
      
      // Desenhar título da rotação
      ctx.fillStyle = '#333'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(rot.name, x + courtWidth / 2, y - 5)
      
      // Desenhar jogadores
      rot.players.forEach(player => {
        const playerX = x + (parseFloat(player.position.x) / 100) * courtWidth
        const playerY = y + (parseFloat(player.position.y) / 100) * courtHeight
        drawPlayer(ctx, playerX, playerY, player.number, player.name)
      })
    })
    
    // Converter para URL da imagem e mostrar na modal
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      setModalImageUrl(url)
      setSelectedRotationName(rotation.name)
      setShowModal(true)
    })
  }

  const closeModal = () => {
    setShowModal(false)
    if (modalImageUrl) {
      URL.revokeObjectURL(modalImageUrl)
      setModalImageUrl('')
    }
    setSelectedRotationName('')
  }

  const generateRotationsImage = () => {
    // Criar todas as 6 rotações a partir da formação atual
    const allRotations = []
    let currentPlayers = [...players]
    
    // Adicionar rotação atual como primeira
    allRotations.push({
      name: 'Rotação 1',
      players: JSON.parse(JSON.stringify(currentPlayers))
    })
    
    // Gerar as outras 5 rotações
    for (let i = 1; i < 6; i++) {
      // Aplicar uma rotação no sentido horário usando o mesmo sistema das outras funções
      const rotatedPlayers = [...currentPlayers]
      
      // Definir as posições exatas das posições indicativas da quadra
      const positions = {
        1: { x: 83.33, y: 69.44 },  // Posição 1 (direita fundo)
        2: { x: 83.33, y: 19.44 },  // Posição 2 (direita frente)  
        3: { x: 50, y: 19.44 },     // Posição 3 (meio frente)
        4: { x: 16.67, y: 19.44 },  // Posição 4 (esquerda frente)
        5: { x: 16.67, y: 69.44 },  // Posição 5 (esquerda fundo)
        6: { x: 50, y: 69.44 }      // Posição 6 (meio fundo)
      }
      
      // Função para calcular distância entre dois pontos
      const calculateDistance = (pos1, pos2) => {
        const dx = pos1.x - pos2.x
        const dy = pos1.y - pos2.y
        return Math.sqrt(dx * dx + dy * dy)
      }
      
      // Encontrar a posição mais próxima de cada jogador
      const playersByPosition = {}
      
      rotatedPlayers.forEach((player, playerIndex) => {
        const playerPos = {
          x: parseFloat(player.position.x),
          y: parseFloat(player.position.y)
        }
        
        let closestPosition = null
        let minDistance = Infinity
        
        // Encontrar a posição mais próxima
        Object.keys(positions).forEach(posNum => {
          const distance = calculateDistance(playerPos, positions[posNum])
          if (distance < minDistance) {
            minDistance = distance
            closestPosition = posNum
          }
        })
        
        // Verificar se a posição já está ocupada por outro jogador mais próximo
        if (!playersByPosition[closestPosition] || 
            calculateDistance(playerPos, positions[closestPosition]) < 
            calculateDistance(
              {
                x: parseFloat(rotatedPlayers[playersByPosition[closestPosition]].position.x),
                y: parseFloat(rotatedPlayers[playersByPosition[closestPosition]].position.y)
              }, 
              positions[closestPosition]
            )) {
          playersByPosition[closestPosition] = playerIndex
        }
      })
      
      // Sistema 6x0 - Rotação no sentido horário: 1→6→5→4→3→2→1
      const rotationMap = { 1: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }
      
      // Aplicar rotação: cada jogador vai para a próxima posição no sentido horário
      Object.keys(playersByPosition).forEach(currentPos => {
        const playerIndex = playersByPosition[currentPos]
        const nextPos = rotationMap[parseInt(currentPos)]
        rotatedPlayers[playerIndex].position = { 
          x: `${positions[nextPos].x}%`, 
          y: `${positions[nextPos].y}%` 
        }
      })
      
      currentPlayers = rotatedPlayers
      allRotations.push({
        name: `Rotação ${i + 1}`,
        players: JSON.parse(JSON.stringify(currentPlayers))
      })
    }
    
    // Criar canvas para desenhar as rotações
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Configurar tamanho do canvas (2 colunas x 3 linhas)
    const courtWidth = 270
    const courtHeight = 180
    const margin = 20
    canvas.width = (courtWidth + margin) * 2 + margin
    canvas.height = (courtHeight + margin) * 3 + margin
    
    // Fundo branco
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Desenhar cada rotação
    allRotations.forEach((rotation, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = margin + col * (courtWidth + margin)
      const y = margin + row * (courtHeight + margin)
      
      // Desenhar quadra
      drawCourt(ctx, x, y, courtWidth, courtHeight)
      
      // Desenhar título da rotação
      ctx.fillStyle = '#333'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(rotation.name, x + courtWidth / 2, y - 5)
      
      // Desenhar jogadores
      rotation.players.forEach(player => {
        const playerX = x + (parseFloat(player.position.x) / 100) * courtWidth
        const playerY = y + (parseFloat(player.position.y) / 100) * courtHeight
        drawPlayer(ctx, playerX, playerY, player.number, player.name)
      })
    })
    
    // Converter para imagem e fazer download
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'falcon-rotacoes.png'
      link.click()
      URL.revokeObjectURL(url)
    })
  }
  
  const drawCourt = (ctx, x, y, width, height) => {
    // Fundo da quadra (amarelo)
    ctx.fillStyle = '#ffd54f'
    ctx.fillRect(x, y, width, height)
    
    // Bordas
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)
    
    // Rede
    ctx.fillStyle = '#333'
    ctx.fillRect(x, y + 8, width, 4)
    
    // Linha dos 3 metros
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + 10, y + height * 0.33)
    ctx.lineTo(x + width - 10, y + height * 0.33)
    ctx.stroke()
    
    // Linha de fundo
    ctx.beginPath()
    ctx.moveTo(x + 10, y + height - 10)
    ctx.lineTo(x + width - 10, y + height - 10)
    ctx.stroke()
    
    // Linhas laterais
    ctx.beginPath()
    ctx.moveTo(x + 10, y + 10)
    ctx.lineTo(x + 10, y + height - 10)
    ctx.moveTo(x + width - 10, y + 10)
    ctx.lineTo(x + width - 10, y + height - 10)
    ctx.stroke()
  }
  
  const drawPlayer = (ctx, x, y, number, name) => {
    // Círculo do jogador com gradiente
    const gradient = ctx.createLinearGradient(x - 15, y - 15, x + 15, y + 15)
    gradient.addColorStop(0, '#42a5f5')
    gradient.addColorStop(1, '#1976d2')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, 15, 0, 2 * Math.PI)
    ctx.fill()
    
    // Borda branca
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Número do jogador
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(number, x, y - 3)
    
    // Nome do jogador
    ctx.font = 'bold 12px Arial'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#333'
    
    // Quebrar nome se for muito longo
    const maxWidth = 40
    const words = name.split(' ')
    let line = ''
    let lineHeight = 12
    let currentY = y + 20
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currentY)
        line = words[i] + ' '
        currentY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), x, currentY)
  }

  return (
    <div className="app">
      <header className="header">
        <img src={falconLogo} alt="Falcon Logo" className="team-logo" />
        <h1>Quadro Tático - Falcon</h1>
      </header>
      
      <div className="main-content">
        <div className="court-section">
          <div 
            className="volleyball-court" 
            ref={courtRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Linhas da quadra */}
            <div className="court-lines">
              <div className="three-meter-line"></div>
              <div className="baseline"></div>
              <div className="sidelines">
                <div className="sideline-left"></div>
                <div className="sideline-right"></div>
              </div>
            </div>
            
            {/* Indicadores de posição */}
            <div className="position-indicators">
              <div className="position-number pos-1">1</div>
              <div className="position-number pos-2">2</div>
              <div className="position-number pos-3">3</div>
              <div className="position-number pos-4">4</div>
              <div className="position-number pos-5">5</div>
              <div className="position-number pos-6">6</div>
            </div>
            
            {/* Rede */}
            <div className="net"></div>
            
            {/* Jogadores */}
            {players.map(player => (
              <div
                key={player.id}
                className={`player ${draggedPlayer === player.id ? 'dragging' : ''} ${(editingPlayer === player.id || editingNumber === player.id) ? 'editing' : ''}`}
                style={{
                  left: player.position.x,
                  top: player.position.y
                }}
                onMouseDown={(e) => (editingPlayer !== player.id && editingNumber !== player.id) && handleMouseDown(e, player)}
                onTouchStart={(e) => (editingPlayer !== player.id && editingNumber !== player.id) && handleTouchStart(e, player)}
              >
                {editingNumber === player.id ? (
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={tempNumber}
                    onChange={(e) => setTempNumber(e.target.value)}
                    onBlur={() => finishEditingNumber(player.id)}
                    onKeyDown={(e) => handleNumberKeyPress(e, player.id)}
                    className="player-number-input"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div 
                    className="player-number" 
                    onDoubleClick={(e) => startEditingNumber(player, e)}
                    onTouchStart={(e) => handleLongPressStart(() => startEditingNumber(player, e), e)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchCancel={handleLongPressEnd}
                    title="Clique duplo ou pressione e segure para editar número"
                  >
                    {player.number}
                  </div>
                )}
                {editingPlayer === player.id ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => finishEditingName(player.id)}
                    onKeyDown={(e) => handleNameKeyPress(e, player.id)}
                    className="player-name-input"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div 
                    className="player-name" 
                    onDoubleClick={(e) => startEditingName(player, e)}
                    onTouchStart={(e) => handleLongPressStart(() => startEditingName(player, e), e)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchCancel={handleLongPressEnd}
                    title="Clique duplo ou pressione e segure para editar nome"
                  >
                    {player.name}
                  </div>
                )}
              </div>
            ))}
          </div>
          

          
          <div className="controls">
            <button className="rotate-btn" onClick={rotatePositions}>
              <span className="material-icons">rotate_right</span>
              Rotar Posições
            </button>
            <button className="save-btn" onClick={saveRotation}>
              <span className="material-icons">save</span>
              Salvar Rotação
            </button>
            <button className="print-btn" onClick={generateRotationsImage}>
              <span className="material-icons">download</span>
              Imprimir Rotações
            </button>
          </div>
        </div>
        
        <div className="sidebar">
          <div className="saved-rotations">
            <h3>Rotações Salvas</h3>
            {savedRotations.length === 0 ? (
              <p className="no-rotations">Nenhuma rotação salva ainda</p>
            ) : (
              savedRotations.map(rotation => (
                <div key={rotation.id} className="saved-rotation">
                  {editingRotation === rotation.id ? (
                    <input
                      type="text"
                      value={tempRotationName}
                      onChange={(e) => setTempRotationName(e.target.value)}
                      onBlur={() => finishEditingRotationName(rotation.id)}
                      onKeyDown={(e) => handleRotationNameKeyPress(e, rotation.id)}
                      className="rotation-name-input"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      className="rotation-name"
                      onDoubleClick={(e) => startEditingRotationName(rotation, e)}
                      title="Clique duplo para editar nome"
                    >
                      {rotation.name}
                    </span>
                  )}
                  <div className="rotation-buttons">
                    <button 
                      className="load-btn"
                      onClick={() => loadRotation(rotation)}
                      title="Carregar rotação"
                    >
                      <span className="material-icons">play_circle</span>
                    </button>
                    <button 
                      className="view-btn"
                      onClick={() => viewRotation(rotation)}
                      title="Visualizar rotações"
                    >
                      <span className="material-icons">visibility</span>
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteRotation(rotation.id)}
                      title="Excluir rotação"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Modal para visualização de rotações */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedRotationName}</h3>
              <button className="modal-close" onClick={closeModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              {modalImageUrl && (
                <img 
                  src={modalImageUrl} 
                  alt="6 Rotações do Vôlei" 
                  className="rotation-image"
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-download" onClick={() => {
                const link = document.createElement('a')
                link.href = modalImageUrl
                link.download = 'falcon-rotacoes-visualizacao.png'
                link.click()
              }}>
                <span className="material-icons">download</span>
                Baixar Imagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
