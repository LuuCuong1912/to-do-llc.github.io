document.addEventListener("DOMContentLoaded", () =>{
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const emptyImage = document.querySelector('.empty-image');
    const todosContainer= document.querySelector('.todos-container');
    const progressBar = document.getElementById('progress');
    const progrssNumbers = document.getElementById('numbers')


    const toggleEmptyState = () => {
        emptyImage.style.display = taskList.children.
        length === 0 ? 'block' : 'none';
        todosContainer.style.width = taskList.children.length > 0 ? '100%' : '50%';
    };

    const updateProgess = (checkCompletion = true) => {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;

        progressBar.style.width= totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%';
        progrssNumbers.textContent = `${completedTasks} / ${totalTasks}`;
        
        if(checkCompletion && totalTasks > 0 && completedTasks === totalTasks){
            Confetti();
        }
    };

    const saveTaskToLocalStorage = () => {
        const tasks = Array.from(taskList.querySelectorAll('li')).map(li => ({
            text: li.querySelector('span').textContent,
            completed: li.querySelector('.checkbox').checked
        }));
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };


    const loadTasksFromLocalStorage = () =>{
        const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        savedTasks.forEach(({text, completed}) => addTask(text, completed, false));
        toggleEmptyState();
        updateProgess();
    }

    //thêm task
    const addTask = (text,completed = false,checkCompletion = true) => {
        
        //khai báo biến taskText để lưu giá trị từ taskInnput được khai báo ở trên vào
        const taskText = text || taskInput.value.trim();
        //nếu trống ô nhập kết thúc hàm
        if(!taskText){
            return;
        }
        //nếu có dữ liệu tạo li để thêm dữ liệu
        const li = document.createElement('li');
        li.innerHTML =
        `<input type = "checkbox" class="checkbox"
        ${completed ? 'checked' : ''} /> 
         <span>${taskText}</span>
         <div class="task-buttons">
            <button class="edit-btn">
            <i class="fa-solid fa-pen"> </i> </button>
            <button class="delete-btn">
            <i class="fa-solid fa-trash"> </i> </button>
         </div>
        `;
        //xóa task
        li.querySelector('.delete-btn').addEventListener('click',() => {
            li.remove();
            toggleEmptyState();
            updateProgess();
            saveTaskToLocalStorage();
        })
        // sửa task
        const checkbox = li.querySelector('.checkbox');
        const btnEdit = li.querySelector('.edit-btn');
        btnEdit.addEventListener('click', () => {
            if(!checkbox.checked){
                taskInput.value= li.querySelector('span').textContent;
                li.remove();
                toggleEmptyState();
                updateProgess(false);
                saveTaskToLocalStorage();
            }
        })
        //Ràng buộc nếu hoàn thành task sẽ không được chỉnh sửa
        if(completed){
            li.classList.add('completed');
            btnEdit.disabled=true;
            btnEdit.style.opacity = '0.5';
            btnEdit.style.pointerEvents = 'none';
        }

        //tích vào task hoàn thành sẽ hiển thị rõ ràng
        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;
            li.classList.toggle('completed',isChecked);
            btnEdit.disabled = isChecked;
            btnEdit.style.opacity =isChecked ? '0.5' : '1';
            btnEdit.style.pointerEvents =isChecked ? 'none' : 'auto';
            updateProgess();
            saveTaskToLocalStorage();
        })

        taskList.appendChild(li);
        taskInput.value ='';
        toggleEmptyState();
        updateProgess(checkCompletion);
        saveTaskToLocalStorage();
    };

    //thêm task bằng cách click vào nút
    const form = document.querySelector(".input-area");
        form.addEventListener("submit", (e) => {
        e.preventDefault();
        addTask();
    });
    //thêm task bằng cách bấm enter
    taskInput.addEventListener('keydown', (e) =>{
        if(e.key === 'Enter'){
            e.preventDefault();
            addTask();
        }
    })

    loadTasksFromLocalStorage();

});


const Confetti = () => {
   confetti({
    position: { x: 800, y: 300},	// Origin position
    count: 100,			// Number of particles
    size: 1,			// Size of the particles
    velocity: 200,		// Initial particle velocity
    fade: false			// Particles fall off the screen, or fade out
});

confetti({
    position: { x: 0, y: 0},	// Origin position
    count: 100,			// Number of particles
    size: 1,			// Size of the particles
    velocity: 200,		// Initial particle velocity
    fade: false			// Particles fall off the screen, or fade out
});
confetti({
    position: { x: 1500, y: 0},	// Origin position
    count: 100,			// Number of particles
    size: 1,			// Size of the particles
    velocity: 200,		// Initial particle velocity
    fade: false			// Particles fall off the screen, or fade out
});
}